import baileys, { DisconnectReason, type WASocket, type BaileysEventMap, proto } from 'baileys';
const makeWASocket = (baileys as any).default || baileys;
import logger from '@/utils/logger.js';
import { firebaseService } from '@/services/FirebaseService.js';
import { multiTenantService } from '@/services/multiTenantService.js';
import { useFirestoreAuthState } from '@/lib/baileysFirestoreAuth.js';
import { BotInstance, BotInstanceSchema, Bot, Result, GlobalContext } from '@/types/index.js';
import { Timestamp, FieldValue } from 'firebase-admin/firestore';

import QRCode from 'qrcode';
import initializeContext from '@/lib/context.js';

import { MiddlewareSystem } from './middlewareSystem.js';
import { permissionMiddleware } from '../middleware/permissions.js';
import { cooldownMiddleware } from '../middleware/cooldown.js';
import { eventHandler } from './eventHandler.js';
import AuthSystem from './authSystem.js';

export class MultiTenantBotService {
  private static instance: MultiTenantBotService;
  private activeBots: Map<string, Bot>;
  private authSystems: Map<string, AuthSystem>;
  private qrCodes: Map<string, string>;
  private globalContext: GlobalContext | null = null;

  private constructor() {
    this.activeBots = new Map();
    this.authSystems = new Map();
    this.qrCodes = new Map();
  }

  public static getInstance(): MultiTenantBotService {
    if (!MultiTenantBotService.instance) {
      MultiTenantBotService.instance = new MultiTenantBotService();
    }
    return MultiTenantBotService.instance;
  }

  /**
   * Get or initialize global context
   */
  private async getContext(): Promise<GlobalContext> {
    if (!this.globalContext) {
      this.globalContext = await initializeContext();
    }
    return this.globalContext;
  }

  public hasActiveBot(id: string): boolean {
    return this.activeBots.has(id);
  }

  /**
   * Create and start a new bot instance
   */
  async createBotInstance(tenantId: string, botData: Partial<BotInstance>): Promise<Result<BotInstance>> {
    try {
      const canAddResult = await multiTenantService.canAddBot(tenantId);
      if (!canAddResult.success || !canAddResult.data) {
        throw new Error('Bot limit exceeded for your current plan.');
      }

      const botId = `bot_${Date.now()}`;
      const rawData = {
        id: botId,
        name: botData.name || 'My Bot',
        status: 'offline' as const,
        connectionMetadata: {
          browser: ['WhatsDeX', 'Chrome', '1.0.0'] as [string, string, string],
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

      const data = BotInstanceSchema.parse(rawData);
      await firebaseService.setDoc<'tenants/{tenantId}/bots'>('bots', botId, data, tenantId);

      this.startBot(tenantId, botId).catch(err => {
        logger.error(`Initial start failed for bot ${botId}:`, err);
      });

      return { success: true, data };
    } catch (error: unknown) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error(`MultiTenantBotService.createBotInstance error [${tenantId}]:`, err);
      return { success: false, error: err };
    }
  }

  /**
   * Start a bot instance with unified AuthSystem
   */
  async startBot(tenantId: string, botId: string): Promise<Result<void>> {
    try {
      if (this.activeBots.has(botId)) {
        logger.info(`Bot ${botId} is already running`);
        return { success: true, data: undefined };
      }

      // 2026: Unified Auth Logic
      const authSystem = new AuthSystem({ bot: {} }, tenantId, botId);
      this.authSystems.set(botId, authSystem);

      // Handle QR updates
      authSystem.on('qr', async (qr) => {
        try {
          const qrCodeUrl = await QRCode.toDataURL(qr);
          this.qrCodes.set(botId, qrCodeUrl);
        } catch (err) {
          logger.error(`QR Generation failed for ${botId}`, err);
        }
      });

      // Handle Disconnection
      authSystem.on('disconnected', async (error) => {
        this.activeBots.delete(botId);
        await this.updateBotStatus(tenantId, botId, 'offline');

        const statusCode = (error as any)?.output?.statusCode;
        if (statusCode === DisconnectReason.loggedOut) {
          this.authSystems.delete(botId);
          this.qrCodes.delete(botId);
        }
      });

      // Handle Connection Success
      authSystem.on('connected', async () => {
        logger.info(`Bot ${botId} (Tenant: ${tenantId}) is ONLINE`);
        this.qrCodes.delete(botId);
        await this.updateBotStatus(tenantId, botId, 'online');
      });

      // Connect via AuthSystem to get the socket
      const connectResult = await authSystem.connect();
      if (!connectResult.success) {
        return { success: false, error: connectResult.error };
      }

      const socket = connectResult.data as unknown as Bot;

      // Initialize Middleware System for this bot
      const mwSystem = new MiddlewareSystem();

      // Inject identifying properties
      socket.tenantId = tenantId;
      socket.botId = botId;
      socket.context = await this.getContext();

      socket.use = (mw) => mwSystem.use(mw);
      socket.executeMiddleware = (ctx, next) => mwSystem.execute(ctx, next);

      // Register Default Middleware
      socket.use(cooldownMiddleware);
      socket.use(permissionMiddleware);

      this.activeBots.set(botId, socket);
      await this.updateBotStatus(tenantId, botId, 'connecting');

      // Forward connection updates to our handler
      socket.ev.on('connection.update', async (update) => {
        await this.handleConnectionUpdate(tenantId, botId, update);
      });

      // Bind Centralized Event Handler
      eventHandler.bind(socket);

      // Note: saveCreds is handled internally by AuthSystem -> useFirestoreAuthState now
      // We don't need to manually bind creds.update here if AuthSystem does it.
      // Checking AuthSystem... yes, it does: this.client.ev.on('creds.update', saveCreds);

      socket.ev.on('messages.upsert', async ({ messages, type }) => {
        if (type === 'notify') {
          for (const message of messages) {
            await this.handleIncomingMessage(tenantId, botId, message);
          }
        }
      });

      logger.info(`Bot ${botId} (Tenant: ${tenantId}) orchestrator started`);
      return { success: true, data: undefined };

    } catch (error: unknown) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error(`Failed to start bot ${botId}:`, err);
      await this.updateBotStatus(tenantId, botId, 'error');
      return { success: false, error: err };
    }
  }

  /**
   * Handle connection updates
   */
  public async handleConnectionUpdate(tenantId: string, botId: string, update: Partial<BaileysEventMap['connection.update']>): Promise<void> {
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
    } catch (error: unknown) {
      logger.error(`Error handling connection update for ${botId}:`, error);
    }
  }

  /**
   * Stop a bot instance
   */
  async stopBot(botId: string): Promise<Result<void>> {
    const authSystem = this.authSystems.get(botId);
    if (authSystem) {
      await authSystem.disconnect();
    }
    this.activeBots.delete(botId);
    this.authSystems.delete(botId);
    this.qrCodes.delete(botId);
    return { success: true, data: undefined };
  }

  /**
   * Handle incoming messages and route to CommandSystem
   */
  private async handleIncomingMessage(tenantId: string, botId: string, message: proto.IWebMessageInfo): Promise<void> {
    try {
      const bot = this.activeBots.get(botId);
      if (!bot) return;

      const context = await this.getContext();

      // Process Commands
      const commandSystem = context.commandSystem;
      const handledByCommand = await commandSystem.processMessage(bot, message);

      // If not a command, try AI (if enabled for this bot/tenant)
      if (!handledByCommand && context.unifiedAI) {
        await context.unifiedAI.processMessage(bot, message);
      }

      // Increment stats
      await this.incrementBotStat(tenantId, botId, 'messagesReceived');

    } catch (error: unknown) {
      logger.error(`Error processing message for ${botId}:`, error);
    }
  }

  /**
   * Helper to increment bot statistics in Firestore
   */
  private async incrementBotStat(tenantId: string, botId: string, field: 'messagesSent' | 'messagesReceived' | 'errorsCount'): Promise<void> {
    try {
      const updateData: Record<string, any> = { stats: {}, updatedAt: Timestamp.now() };
      updateData.stats[field] = FieldValue.increment(1);

      await firebaseService.setDoc<'tenants/{tenantId}/bots'>(
        'bots',
        botId,
        updateData,
        tenantId,
        true
      );

    } catch (err) {
      // Silently fail stat updates
    }
  }

  /**
   * Helper to update bot status in Firestore
   */
  private async updateBotStatus(tenantId: string, botId: string, status: BotInstance['status']): Promise<void> {
    await firebaseService.setDoc<'tenants/{tenantId}/bots'>(
      'bots',
      botId,
      { status, updatedAt: Timestamp.now() },
      tenantId,
      true
    );
  }

  public getActiveBots() {
    return Array.from(this.activeBots.keys()).map(id => ({
      id,
      isActive: true,
    }));
  }

  public getStats() {
    return {
      activeBots: this.activeBots.size,
      totalQRsGenerated: this.qrCodes.size,
      runningProcesses: 1
    };
  }

  async startAllBots() {
    // To be implemented: fetch all bots with auto-start enabled and start them
  }

  async stopAllBots(): Promise<void> {
    logger.info('Stopping all active bots...');
    for (const botId of this.activeBots.keys()) {
      await this.stopBot(botId);
    }
  }
}

export const multiTenantBotService = MultiTenantBotService.getInstance();
export default multiTenantBotService;
