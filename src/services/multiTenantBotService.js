import { makeWASocket, DisconnectReason, useMultiFileAuthState } from '@whiskeysockets/baileys';
import { PrismaClient } from '@prisma/client';
import logger from '../utils/logger.js';
import multiTenantService from './multiTenantService.js';
import fs from 'fs';
import path from 'path';
import QRCode from 'qrcode';

const prisma = new PrismaClient();

export class MultiTenantBotService {
  constructor() {
    this.activeBots = new Map(); // botInstanceId -> socket
    this.qrCodes = new Map(); // botInstanceId -> qr code
  }

  // Create and start a new bot instance
  async createBotInstance(tenantId, botData) {
    try {
      // Check plan limits
      const limitCheck = await multiTenantService.checkPlanLimits(tenantId, 'maxBots');
      if (!limitCheck.canProceed) {
        throw new Error(`Bot limit exceeded. Current plan allows ${limitCheck.limit} bots.`);
      }

      // Create bot instance in database
      const botInstance = await multiTenantService.createBotInstance(tenantId, botData);
      
      // Start bot
      await this.startBot(botInstance.id);
      
      return botInstance;
    } catch (error) {
      logger.error('Failed to create bot instance', { error: error.message, tenantId });
      throw error;
    }
  }

  // Start a bot instance
  async startBot(botInstanceId) {
    try {
      const botInstance = await prisma.botInstance.findUnique({
        where: { id: botInstanceId },
        include: { tenant: true }
      });

      if (!botInstance) {
        throw new Error('Bot instance not found');
      }

      if (this.activeBots.has(botInstanceId)) {
        logger.info(`Bot ${botInstanceId} is already running`);
        return;
      }

      // Create session directory
      const sessionDir = path.join(process.cwd(), 'sessions', botInstanceId);
      if (!fs.existsSync(sessionDir)) {
        fs.mkdirSync(sessionDir, { recursive: true });
      }

      // Initialize auth state
      const { state, saveCreds } = await useMultiFileAuthState(sessionDir);

      // Create socket
      const socket = makeWASocket({
        auth: state,
        printQRInTerminal: false,
        generateHighQualityLinkPreview: true,
        keepAliveIntervalMs: 30000,
        markOnlineOnConnect: true,
      });

      // Store active bot
      this.activeBots.set(botInstanceId, socket);

      // Event handlers
      socket.ev.on('connection.update', async (update) => {
        await this.handleConnectionUpdate(botInstanceId, update);
      });

      socket.ev.on('creds.update', saveCreds);

      socket.ev.on('messages.upsert', async ({ messages, type }) => {
        if (type === 'notify') {
          for (const message of messages) {
            await this.handleIncomingMessage(botInstanceId, message);
          }
        }
      });

      socket.ev.on('contacts.update', async (contacts) => {
        await this.handleContactsUpdate(botInstanceId, contacts);
      });

      socket.ev.on('groups.update', async (groups) => {
        await this.handleGroupsUpdate(botInstanceId, groups);
      });

      logger.info(`Bot ${botInstanceId} started successfully`);
      
      // Update status
      await multiTenantService.updateBotStatus(botInstanceId, 'connecting');

    } catch (error) {
      logger.error('Failed to start bot', { error: error.message, botInstanceId });
      
      // Update status to error
      await multiTenantService.updateBotStatus(botInstanceId, 'error');
      throw error;
    }
  }

  // Stop a bot instance
  async stopBot(botInstanceId) {
    try {
      const socket = this.activeBots.get(botInstanceId);
      if (socket) {
        await socket.logout();
        socket.end();
        this.activeBots.delete(botInstanceId);
      }

      // Clean up QR code
      this.qrCodes.delete(botInstanceId);

      // Update status
      await multiTenantService.updateBotStatus(botInstanceId, 'disconnected');

      logger.info(`Bot ${botInstanceId} stopped successfully`);
    } catch (error) {
      logger.error('Failed to stop bot', { error: error.message, botInstanceId });
      throw error;
    }
  }

  // Handle connection updates
  async handleConnectionUpdate(botInstanceId, update) {
    try {
      const { connection, lastDisconnect, qr } = update;

      if (qr) {
        // Generate QR code
        const qrCodeUrl = await QRCode.toDataURL(qr);
        this.qrCodes.set(botInstanceId, qrCodeUrl);
        
        // Update database with QR code
        await prisma.botInstance.update({
          where: { id: botInstanceId },
          data: { 
            qrCode: qrCodeUrl,
            status: 'scanning'
          }
        });

        logger.info(`QR code generated for bot ${botInstanceId}`);
      }

      if (connection === 'close') {
        const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
        
        if (shouldReconnect) {
          logger.info(`Bot ${botInstanceId} disconnected, attempting to reconnect...`);
          setTimeout(() => this.startBot(botInstanceId), 5000);
        } else {
          logger.info(`Bot ${botInstanceId} logged out`);
          await multiTenantService.updateBotStatus(botInstanceId, 'disconnected');
          this.activeBots.delete(botInstanceId);
          this.qrCodes.delete(botInstanceId);
        }
      } else if (connection === 'open') {
        logger.info(`Bot ${botInstanceId} connected successfully`);
        
        // Clear QR code and update status
        this.qrCodes.delete(botInstanceId);
        await prisma.botInstance.update({
          where: { id: botInstanceId },
          data: {
            qrCode: null,
            status: 'connected',
            lastActivity: new Date()
          }
        });

        // Get bot info
        const socket = this.activeBots.get(botInstanceId);
        if (socket?.user) {
          // Mark the connected WhatsApp account as owner for this bot instance
          const ownerJid = socket.user.id;
          await prisma.botUser.upsert({
            where: { botInstanceId_jid: { botInstanceId, jid: ownerJid } },
            update: { role: 'owner', name: socket.user.name || undefined, phone: ownerJid.split('@')[0] },
            create: { botInstanceId, jid: ownerJid, role: 'owner', name: socket.user.name || undefined, phone: ownerJid.split('@')[0] }
          });

          await prisma.botInstance.update({
            where: { id: botInstanceId },
            data: {
              phoneNumber: socket.user.id.split(':')[0]
            }
          });
        }
      }
    } catch (error) {
      logger.error('Failed to handle connection update', { error: error.message, botInstanceId });
    }
  }

  // Handle incoming messages
  async handleIncomingMessage(botInstanceId, message) {
    try {
      if (!message.key || !message.key.remoteJid) return;

      const botInstance = await prisma.botInstance.findUnique({
        where: { id: botInstanceId },
        include: { tenant: true }
      });

      if (!botInstance) return;

      // Check message limits
      const limitCheck = await multiTenantService.checkPlanLimits(
        botInstance.tenantId, 
        'maxMessages'
      );
      
      if (!limitCheck.canProceed) {
        logger.warn(`Message limit exceeded for tenant ${botInstance.tenantId}`);
        return;
      }

      // Get or create user
      const userJid = message.key.remoteJid;
      let botUser = await prisma.botUser.findUnique({
        where: { botInstanceId_jid: { botInstanceId, jid: userJid } }
      });

      if (!botUser) {
        botUser = await prisma.botUser.create({
          data: {
            botInstanceId,
            jid: userJid,
            name: message.pushName || null,
            phone: userJid.split('@')[0]
          }
        });
      }

      // Extract message content
      const messageType = Object.keys(message.message || {})[0];
      let content = '';
      let mediaUrl = null;

      if (messageType === 'conversation') {
        content = message.message.conversation;
      } else if (messageType === 'extendedTextMessage') {
        content = message.message.extendedTextMessage.text;
      } else if (['imageMessage', 'videoMessage', 'audioMessage', 'documentMessage'].includes(messageType)) {
        content = message.message[messageType].caption || '';
        // TODO: Handle media download and storage
      }

      // Save message
      await prisma.botMessage.create({
        data: {
          botInstanceId,
          userId: botUser.id,
          messageId: message.key.id,
          fromJid: message.key.remoteJid,
          toJid: botInstance.phoneNumber || 'bot',
          type: messageType,
          content,
          mediaUrl,
          isIncoming: true,
          timestamp: new Date(message.messageTimestamp * 1000)
        }
      });

      // Update user last activity
      await prisma.botUser.update({
        where: { id: botUser.id },
        data: { lastActivity: new Date() }
      });

      // Record analytics
      await multiTenantService.recordAnalytic(
        botInstance.tenantId,
        'message_received',
        1,
        { messageType, botInstanceId }
      );

      // Process command if it looks like one
      if (content.startsWith('/') || content.startsWith('.') || content.startsWith('!')) {
        await this.processCommand(botInstanceId, message, content);
      }

      logger.info(`Message processed for bot ${botInstanceId}`, { 
        from: userJid, 
        type: messageType 
      });

    } catch (error) {
      logger.error('Failed to handle incoming message', { 
        error: error.message, 
        botInstanceId 
      });
    }
  }

  // Process bot commands
  async processCommand(botInstanceId, message, content) {
    try {
      const socket = this.activeBots.get(botInstanceId);
      if (!socket) return;

      const botInstance = await prisma.botInstance.findUnique({
        where: { id: botInstanceId }
      });

      if (!botInstance) return;

      const config = JSON.parse(botInstance.config || '{}');
      const command = content.split(' ')[0].toLowerCase();

      let response = '';

      switch (command) {
        case '/start':
        case '/help':
          response = config.welcomeMessage || 'Hello! I am your WhatsApp assistant. How can I help you today?';
          break;
        case '/ping':
          response = 'Pong! 🏓 I am online and ready to help.';
          break;
        case '/info':
          response = `Bot: ${botInstance.name}\nStatus: Connected\nTenant: ${botInstance.tenantId}`;
          break;
        default:
          if (config.aiEnabled) {
            // TODO: Integrate with AI service
            response = 'I received your message! AI integration coming soon.';
          } else {
            response = 'Sorry, I didn\'t understand that command. Type /help for available commands.';
          }
      }

      // Send response
      await socket.sendMessage(message.key.remoteJid, { text: response });

      // Save outgoing message
      await prisma.botMessage.create({
        data: {
          botInstanceId,
          messageId: `bot_${Date.now()}`,
          fromJid: botInstance.phoneNumber || 'bot',
          toJid: message.key.remoteJid,
          type: 'text',
          content: response,
          isIncoming: false
        }
      });

    } catch (error) {
      logger.error('Failed to process command', { error: error.message, botInstanceId });
    }
  }

  // Handle contacts update
  async handleContactsUpdate(botInstanceId, contacts) {
    try {
      for (const contact of contacts) {
        await prisma.botUser.upsert({
          where: { botInstanceId_jid: { botInstanceId, jid: contact.id } },
          update: { 
            name: contact.name || contact.verifiedName || contact.notify 
          },
          create: {
            botInstanceId,
            jid: contact.id,
            name: contact.name || contact.verifiedName || contact.notify,
            phone: contact.id.split('@')[0]
          }
        });
      }
    } catch (error) {
      logger.error('Failed to handle contacts update', { error: error.message, botInstanceId });
    }
  }

  // Handle groups update
  async handleGroupsUpdate(botInstanceId, groups) {
    try {
      for (const group of groups) {
        await prisma.botGroup.upsert({
          where: { botInstanceId_jid: { botInstanceId, jid: group.id } },
          update: {
            name: group.subject,
            description: group.desc,
            memberCount: group.participants?.length || 0
          },
          create: {
            botInstanceId,
            jid: group.id,
            name: group.subject,
            description: group.desc,
            memberCount: group.participants?.length || 0
          }
        });
      }
    } catch (error) {
      logger.error('Failed to handle groups update', { error: error.message, botInstanceId });
    }
  }

  // Get QR code for a bot
  getQRCode(botInstanceId) {
    return this.qrCodes.get(botInstanceId);
  }

  // Send message through bot
  async sendMessage(botInstanceId, to, message) {
    try {
      const socket = this.activeBots.get(botInstanceId);
      if (!socket) {
        throw new Error('Bot not connected');
      }

      const sent = await socket.sendMessage(to, message);

      // Save outgoing message
      await prisma.botMessage.create({
        data: {
          botInstanceId,
          messageId: sent.key.id,
          fromJid: 'bot',
          toJid: to,
          type: 'text',
          content: message.text || 'media',
          isIncoming: false
        }
      });

      return sent;
    } catch (error) {
      logger.error('Failed to send message', { error: error.message, botInstanceId });
      throw error;
    }
  }

  // Get bot status
  async getBotStatus(botInstanceId) {
    try {
      const botInstance = await prisma.botInstance.findUnique({
        where: { id: botInstanceId }
      });

      if (!botInstance) {
        throw new Error('Bot instance not found');
      }

      const isActive = this.activeBots.has(botInstanceId);
      const qrCode = this.qrCodes.get(botInstanceId);

      return {
        ...botInstance,
        isActive,
        qrCode: qrCode || botInstance.qrCode
      };
    } catch (error) {
      logger.error('Failed to get bot status', { error: error.message, botInstanceId });
      throw error;
    }
  }

  // Start all bots for a tenant
  async startTenantBots(tenantId) {
    try {
      const botInstances = await prisma.botInstance.findMany({
        where: { tenantId, isActive: true }
      });

      for (const bot of botInstances) {
        try {
          await this.startBot(bot.id);
        } catch (error) {
          logger.error(`Failed to start bot ${bot.id}`, { error: error.message });
        }
      }

      logger.info(`Started ${botInstances.length} bots for tenant ${tenantId}`);
    } catch (error) {
      logger.error('Failed to start tenant bots', { error: error.message, tenantId });
    }
  }

  // Stop all bots for a tenant
  async stopTenantBots(tenantId) {
    try {
      const botInstances = await prisma.botInstance.findMany({
        where: { tenantId }
      });

      for (const bot of botInstances) {
        try {
          await this.stopBot(bot.id);
        } catch (error) {
          logger.error(`Failed to stop bot ${bot.id}`, { error: error.message });
        }
      }

      logger.info(`Stopped bots for tenant ${tenantId}`);
    } catch (error) {
      logger.error('Failed to stop tenant bots', { error: error.message, tenantId });
    }
  }

  // Get analytics for a bot
  async getBotAnalytics(botInstanceId, startDate, endDate) {
    try {
      const messageCount = await prisma.botMessage.count({
        where: {
          botInstanceId,
          timestamp: {
            gte: startDate,
            lte: endDate
          }
        }
      });

      const userCount = await prisma.botUser.count({
        where: { botInstanceId }
      });

      const groupCount = await prisma.botGroup.count({
        where: { botInstanceId, isActive: true }
      });

      const recentMessages = await prisma.botMessage.findMany({
        where: { botInstanceId },
        include: { user: true },
        orderBy: { timestamp: 'desc' },
        take: 10
      });

      return {
        messageCount,
        userCount,
        groupCount,
        recentMessages
      };
    } catch (error) {
      logger.error('Failed to get bot analytics', { error: error.message, botInstanceId });
      throw error;
    }
  }
}

export default new MultiTenantBotService();