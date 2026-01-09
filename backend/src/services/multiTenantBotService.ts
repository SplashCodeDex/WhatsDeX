import baileys, { DisconnectReason, type WASocket } from '@whiskeysockets/baileys';
const makeWASocket = (baileys as any).default || baileys;
import logger from '@/utils/logger.js';
import { firebaseService } from '@/services/FirebaseService.js';
import { multiTenantService } from '@/services/multiTenantService.js';
import { useFirestoreAuthState } from '@/lib/baileysFirestoreAuth.js';
import { BotInstanceDocument } from '@/types/index.js';
import { Timestamp } from 'firebase-admin/firestore';
import QRCode from 'qrcode';

export class MultiTenantBotService {
  private static instance: MultiTenantBotService;
  private activeBots: Map<string, any>;
  private qrCodes: Map<string, string>;

  private constructor() {
    this.activeBots = new Map();
    this.qrCodes = new Map();
  }

  // Check if a bot is already active
  public hasActiveBot(id: string): boolean {
    return this.activeBots.has(id);
  }

  public static getInstance(): MultiTenantBotService {
    if (!MultiTenantBotService.instance) {
      MultiTenantBotService.instance = new MultiTenantBotService();
    }
    return MultiTenantBotService.instance;
  }

  /**
   * Create and start a new bot instance
   */
  async createBotInstance(tenantId: string, botData: Partial<BotInstanceDocument>): Promise<BotInstanceDocument> {
    try {
      // 1. Check plan limits
      const canAdd = await multiTenantService.canAddBot(tenantId);
      if (!canAdd) {
        throw new Error('Bot limit exceeded for your current plan.');
      }

      // 2. Prepare bot document
      const botId = `bot_${Date.now()}`;
      const data: BotInstanceDocument = {
        id: botId,
        name: botData.name || 'My Bot',
        status: 'offline',
        connectionMetadata: {
          browser: ['WhatsDeX', 'Chrome', '1.0.0'],
          platform: 'web'
        },
        stats: {
          messagesSent: 0,
          messagesReceived: 0,
          errorsCount: 0
        },
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        ...botData
      };

      // 3. Save to Firestore
      await firebaseService.setDoc<'tenants/{tenantId}/bots'>('bots', botId, data, tenantId);

      // 4. Start the bot
      this.startBot(tenantId, botId).catch(err => {
        logger.error(`Initial start failed for bot ${botId}:`, err);
      });

      return data;
    } catch (error: any) {
      logger.error(`MultiTenantBotService.createBotInstance error [${tenantId}]:`, error);
      throw error;
    }
  }

  // Helper bridge for jadibot/legacy commands
  async createBot(client: any, ctx: any, tenantId: string) {
    logger.info(`jadibot request for tenant: ${tenantId}`);
    return this.createBotInstance(tenantId, { name: `Bot ${tenantId}`, userId: tenantId } as any);
  }

  /**
   * Start a bot instance with Firestore-backed auth
   */
  async startBot(tenantId: string, botId: string): Promise<void> {
    try {
      if (this.activeBots.has(botId)) {
        logger.info(`Bot ${botId} is already running`);
        return;
      }

      // 1. Initialize Firestore Auth State
      const { state, saveCreds } = await useFirestoreAuthState(tenantId, botId);

      // 2. Create Socket
      const socket = makeWASocket({
        auth: state,
        printQRInTerminal: false,
        markOnlineOnConnect: true,
      });

      // 3. Store in memory
      this.activeBots.set(botId, socket);

      // 4. Update status to connecting
      await this.updateBotStatus(tenantId, botId, 'connecting');

      // 5. Setup Event Listeners
      socket.ev.on('connection.update', async (update: any) => {
        await this.handleConnectionUpdate(tenantId, botId, update);
      });

      socket.ev.on('creds.update', saveCreds);

      socket.ev.on('messages.upsert', async ({ messages, type }: any) => {
        if (type === 'notify') {
          for (const message of messages) {
            await this.handleIncomingMessage(tenantId, botId, message);
          }
        }
      });

      logger.info(`Bot ${botId} (Tenant: ${tenantId}) initialized`);

    } catch (error: any) {
      logger.error(`Failed to start bot ${botId}:`, error);
      await this.updateBotStatus(tenantId, botId, 'error');
      throw error;
    }
  }

  /**
   * Handle connection updates and sync to Firestore
   */
  private async handleConnectionUpdate(tenantId: string, botId: string, update: any): Promise<void> {
    const { connection, lastDisconnect, qr } = update;

    try {
      if (qr) {
        const qrCodeUrl = await QRCode.toDataURL(qr);
        this.qrCodes.set(botId, qrCodeUrl);
      }

      if (connection === 'close') {
        const statusCode = (lastDisconnect?.error as any)?.output?.statusCode;
        const shouldReconnect = statusCode !== DisconnectReason.loggedOut;

        await this.updateBotStatus(tenantId, botId, 'offline');

        if (shouldReconnect) {
          logger.info(`Bot ${botId} disconnected, reconnecting...`);
          setTimeout(() => this.startBot(tenantId, botId), 5000);
        } else {
          logger.info(`Bot ${botId} logged out.`);
          this.activeBots.delete(botId);
          this.qrCodes.delete(botId);
        }
      } else if (connection === 'open') {
        logger.info(`Bot ${botId} is ONLINE`);
        this.qrCodes.delete(botId);
        await this.updateBotStatus(tenantId, botId, 'online');
      }
    } catch (error: any) {
      logger.error(`Error handling connection update for ${botId}:`, error);
    }
  }

  /**
   * Helper to update bot status in Firestore
   */
  private async updateBotStatus(tenantId: string, botId: string, status: BotInstanceDocument['status']): Promise<void> {
    await firebaseService.setDoc<'tenants/{tenantId}/bots'>(
      'bots',
      botId,
      { status, updatedAt: Timestamp.now() },
      tenantId,
      true
    );
  }

  /**
   * Handle incoming messages (delegation placeholder)
   */
  private async handleIncomingMessage(tenantId: string, botId: string, message: any): Promise<void> {
    logger.debug(`Incoming message for bot ${botId}:`, message.key.remoteJid);
  }

  /**
   * Stop a bot instance
   */
  async stopBot(botId: string): Promise<void> {
    const socket = this.activeBots.get(botId);
    if (socket) {
      socket.end(undefined);
      this.activeBots.delete(botId);
    }
    this.qrCodes.delete(botId);
  }

  /**
   * Get all active bot instances
   */
  public getActiveBots() {
    return Array.from(this.activeBots.keys()).map(id => ({
      id,
      isActive: true, // If it's in the map, it's active
      // Add more metadata if available
    }));
  }

  /**
   * Get global bot service statistics
   */
  public getStats() {
    return {
      activeBots: this.activeBots.size,
      totalQRsGenerated: this.qrCodes.size,
      runningProcesses: process.env.NODE_ENV === 'production' ? 1 : 1 // Simplified
    };
  }

  /**
   * Stop all active bots
   */
  async stopAllBots(): Promise<void> {
    logger.info('Stopping all active bots...');
    for (const botId of this.activeBots.keys()) {
      await this.stopBot(botId);
    }
  }
}

export const multiTenantBotService = MultiTenantBotService.getInstance();
export default multiTenantBotService;