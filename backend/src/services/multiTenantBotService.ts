import { makeWASocket, DisconnectReason, useMultiFileAuthState } from '@whiskeysockets/baileys';
import logger from '../utils/logger';
import multiTenantService from './multiTenantService';
import databaseService from './database';
import fs from 'fs';
import path from 'path';
import os from 'os';
import QRCode from 'qrcode';

interface BotInstance {
  id: string;
  tenantId: string;
  [key: string]: any;
}

export class MultiTenantBotService {
  private activeBots: Map<string, any>;
  private qrCodes: Map<string, string>;

  constructor() {
    this.activeBots = new Map(); // botInstanceId -> socket
    this.qrCodes = new Map(); // botInstanceId -> qr code
  }

  // Create and start a new bot instance
  async createBotInstance(tenantId: string, botData: any): Promise<BotInstance> {
    try {
      // Check plan limits
      const limitCheck = await multiTenantService.checkPlanLimits(tenantId, 'maxBots');
      if (!limitCheck.canProceed) {
        throw new Error(`Bot limit exceeded. Current plan allows ${limitCheck.limit} bots.`);
      }

      // Create bot instance in the database
      const botId = `bot_${Date.now()}`;
      const botInstance: BotInstance = { id: botId, ...botData, tenantId, status: 'creating' };
      await databaseService.setDoc(tenantId, 'bots', botId, botInstance);
      logger.info('Bot instance created in database', { tenantId, botId });

      // Attempt to start bot
      try {
        await this.startBot(tenantId, botId);
      } catch (startErr: any) {
        logger.error('Bot created but failed to start socket', { error: startErr.message, tenantId, botId });
        await databaseService.setDoc(tenantId, 'bots', botId, { status: 'failed_to_start' });
      }

      return botInstance;
    } catch (error: any) {
      logger.error('Failed to create bot instance', { error: error.message, tenantId });
      throw error;
    }
  }

  // Start a bot instance
  async startBot(tenantId: string, botInstanceId: string): Promise<void> {
    try {
      const botInstance = await databaseService.getDoc(tenantId, 'bots', botInstanceId);
      if (!botInstance) {
        throw new Error(`Bot instance ${botInstanceId} not found for tenant ${tenantId}`);
      }

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
      socket.ev.on('connection.update', async (update: any) => {
        await this.handleConnectionUpdate(tenantId, botInstanceId, update);
      });

      socket.ev.on('creds.update', saveCreds);

      socket.ev.on('messages.upsert', async ({ messages, type }: any) => {
        if (type === 'notify') {
          for (const message of messages) {
            await this.handleIncomingMessage(tenantId, botInstanceId, message);
          }
        }
      });

      await databaseService.setDoc(tenantId, 'bots', botInstanceId, { status: 'starting' });
      logger.info(`Bot ${botInstanceId} starting...`, { tenantId });

    } catch (error: any) {
      logger.error('Failed to start bot', { error: error.message, botInstanceId, tenantId });
      await databaseService.setDoc(tenantId, 'bots', botInstanceId, { status: 'failed' });
      throw error;
    }
  }

  // Stop a bot instance
  async stopBot(tenantId: string, botInstanceId: string): Promise<void> {
    try {
      const socket = this.activeBots.get(botInstanceId);
      if (socket) {
        await socket.logout();
        socket.end(); // Properly close the connection
        this.activeBots.delete(botInstanceId);
      }
      this.qrCodes.delete(botInstanceId);
      await databaseService.setDoc(tenantId, 'bots', botInstanceId, { status: 'stopped' });
      logger.info(`Bot ${botInstanceId} stopped successfully`, { tenantId });
    } catch (error: any) {
      logger.error('Failed to stop bot', { error: error.message, botInstanceId, tenantId });
      await databaseService.setDoc(tenantId, 'bots', botInstanceId, { status: 'failed_to_stop' });
      throw error;
    }
  }

  // Handle connection updates
  async handleConnectionUpdate(tenantId: string, botInstanceId: string, update: any): Promise<void> {
    try {
      const { connection, lastDisconnect, qr } = update;

      if (qr) {
        const qrCodeUrl = await QRCode.toDataURL(qr);
        this.qrCodes.set(botInstanceId, qrCodeUrl);
        await databaseService.setDoc(tenantId, 'bots', botInstanceId, { qrCode: qrCodeUrl, status: 'pending_qr' });
      }

      if (connection === 'close') {
        const shouldReconnect = (lastDisconnect?.error as any)?.output?.statusCode !== DisconnectReason.loggedOut;
        if (shouldReconnect) {
          logger.info(`Bot ${botInstanceId} disconnected, attempting to reconnect...`, { tenantId });
          await databaseService.setDoc(tenantId, 'bots', botInstanceId, { status: 'reconnecting' });
          setTimeout(() => this.startBot(tenantId, botInstanceId), 5000);
        } else {
          logger.info(`Bot ${botInstanceId} logged out`, { tenantId });
          this.activeBots.delete(botInstanceId);
          this.qrCodes.delete(botInstanceId);
          await databaseService.setDoc(tenantId, 'bots', botInstanceId, { status: 'logged_out', qrCode: null });
        }
      } else if (connection === 'open') {
        logger.info(`Bot ${botInstanceId} connected successfully`, { tenantId });
        this.qrCodes.delete(botInstanceId);
        await databaseService.setDoc(tenantId, 'bots', botInstanceId, { status: 'connected', qrCode: null });
      }
    } catch (error: any) {
      logger.error('Failed to handle connection update', { error: error.message, botInstanceId, tenantId });
    }
  }

  // Handle incoming messages
  async handleIncomingMessage(tenantId: string, botInstanceId: string, message: any): Promise<void> {
    try {
      if (!message.key || !message.key.remoteJid) return;
      // Log message for analytics/debugging
      await databaseService.setDoc(tenantId, 'messages', message.key.id, {
        botId: botInstanceId,
        message,
        timestamp: new Date(),
      });
      // Logic for message processing and AI will go here
    } catch (error: any) {
      logger.error('Failed to handle incoming message', { error: error.message, botInstanceId, tenantId });
    }
  }

  // Start all bots from the database
  async startAllBots(): Promise<void> {
    // This is a complex operation in a multi-tenant environment.
    // A better approach is to start bots on-demand or based on tenant activity.
    // For now, this is a placeholder for a more robust startup orchestration.
    logger.warn('startAllBots is a placeholder and not implemented for multi-tenancy.');
  }

  // Stop all bots
  async stopAllBots(): Promise<void> {
    logger.info('Stopping all active bots...');
    // This needs to be tenant-aware. The current implementation is not.
    // A proper implementation would fetch all tenants and then stop bots for each.
    for (const botId of this.activeBots.keys()) {
      // We are missing tenantId here, which is a critical flaw.
      // This method should be redesigned or used with extreme caution.
      logger.warn(`Stopping bot ${botId} without tenant context. This is unsafe.`);
      // await this.stopBot(tenantId, botId);
    }
  }
}

export default new MultiTenantBotService();
