import { makeWASocket, DisconnectReason, useMultiFileAuthState } from '@whiskeysockets/baileys';
import { Server as SocketIOServer } from 'socket.io';
import logger from '../utils/logger';
import multiTenantService from './multiTenantService';
import fs from 'fs';
import path from 'path';
import os from 'os';
import QRCode from 'qrcode';

export class MultiTenantBotService {
  private io: SocketIOServer;
  private activeBots: Map<string, any>;
  private qrCodes: Map<string, string>;

  constructor() {
    this.activeBots = new Map(); // botInstanceId -> socket
    this.qrCodes = new Map(); // botInstanceId -> qr code
  }

  initialize(io: SocketIOServer) {
    this.io = io;
  }

  // Create and start a new bot instance
  async createBotInstance(tenantId, botData) {
    try {
      // Check plan limits
      const limitCheck = await multiTenantService.checkPlanLimits(tenantId, 'maxBots');
      if (!limitCheck.canProceed) {
        throw new Error(`Bot limit exceeded. Current plan allows ${limitCheck.limit} bots.`);
      }

      // Create bot instance placeholder
      const botInstance = { id: `bot_${Date.now()}`, ...botData, tenantId };
      logger.info('🔥 Firebase createBotInstance placeholder', { botInstance });

      // Attempt to start bot
      try {
        await this.startBot(botInstance.id);
      } catch (startErr) {
        logger.error('Bot created but failed to start socket', { error: startErr.message, tenantId, botId: botInstance.id });
      }

      return botInstance;
    } catch (error) {
      logger.error('Failed to create bot instance', { error: error.message, tenantId });
      throw error;
    }
  }

  // Start a bot instance
  async startBot(botInstanceId) {
    try {
      logger.info('🔥 Firebase getBotInstance placeholder', { botInstanceId });

      // For now, we use a mock bot instance if not found in db
      const botInstance = { id: botInstanceId, tenant: { id: 'test-tenant' } };

      if (this.activeBots.has(botInstanceId)) {
        logger.info(`Bot ${botInstanceId} is already running`);
        return;
      }

      // Create session directory
      const baseSessionRoot = process.env.SESSIONS_DIR || path.join(os.tmpdir(), 'whatsdex-sessions');
      const sessionDir = path.join(baseSessionRoot, botInstanceId);
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

      logger.info(`Bot ${botInstanceId} started successfully`);

    } catch (error) {
      logger.error('Failed to start bot', { error: error.message, botInstanceId });
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
      this.qrCodes.delete(botInstanceId);
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
      const tenantId = botInstanceId.split('_')[0]; // Assuming botInstanceId is tenantId_botId

      if (qr) {
        const qrCodeUrl = await QRCode.toDataURL(qr);
        this.qrCodes.set(botInstanceId, qrCodeUrl);
        this.io.to(tenantId).emit('whatsapp-status', { event: 'qr-code', data: qrCodeUrl });
        logger.info('🔥 Firebase updateBotQR placeholder', { botInstanceId });
      }

      if (connection === 'close') {
        this.io.to(tenantId).emit('whatsapp-status', { event: 'disconnected', data: null });
        const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
        if (shouldReconnect) {
          logger.info(`Bot ${botInstanceId} disconnected, attempting to reconnect...`);
          setTimeout(() => this.startBot(botInstanceId), 5000);
        } else {
          logger.info(`Bot ${botInstanceId} logged out`);
          this.activeBots.delete(botInstanceId);
          this.qrCodes.delete(botInstanceId);
        }
      } else if (connection === 'open') {
        logger.info(`Bot ${botInstanceId} connected successfully`);
        this.qrCodes.delete(botInstanceId);
        this.io.to(tenantId).emit('whatsapp-status', { event: 'connected', data: null });
        logger.info('🔥 Firebase updateBotConnected placeholder', { botInstanceId });
      }
    } catch (error) {
      logger.error('Failed to handle connection update', { error: error.message, botInstanceId });
    }
  }

  // Handle incoming messages
  async handleIncomingMessage(botInstanceId, message) {
    try {
      if (!message.key || !message.key.remoteJid) return;
      logger.info('🔥 Firebase handleIncomingMessage placeholder', { botInstanceId, from: message.key.remoteJid });
      // Logic for message processing and AI will go here
    } catch (error) {
      logger.error('Failed to handle incoming message', { error: error.message, botInstanceId });
    }
  }

  // Start all bots (placeholder)
  async startAllBots() {
    logger.info('🔥 Firebase startAllBots placeholder');
  }

  // Stop all bots
  async stopAllBots() {
    logger.info('Stopping all active bots...');
    for (const botId of this.activeBots.keys()) {
      await this.stopBot(botId);
    }
  }
}

export default new MultiTenantBotService();
