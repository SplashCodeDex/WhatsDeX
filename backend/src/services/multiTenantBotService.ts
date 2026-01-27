import baileys, { DisconnectReason, type WASocket, type BaileysEventMap, proto } from 'baileys';
const makeWASocket = (baileys as any).default || baileys;
import logger from '@/utils/logger.js';
import crypto from 'crypto';
import { firebaseService } from '@/services/FirebaseService.js';
import { multiTenantService } from '@/services/multiTenantService.js';
import { useFirestoreAuthState } from '@/lib/baileysFirestoreAuth.js';
import { tenantConfigService } from './tenantConfigService.js';
import { webhookService } from './webhookService.js';
import { socketService } from './socketService.js';
import { BotInstanceSchema, Bot, GlobalContext } from '@/types/index.js';
import { Campaign, BotInstance, Result, CampaignStatus } from '../types/contracts.js';
import { Timestamp, FieldValue } from 'firebase-admin/firestore';

import QRCode from 'qrcode';
import initializeContext from '@/lib/context.js';

import { MiddlewareSystem } from './middlewareSystem.js';
import { permissionMiddleware } from '../middleware/permissions.js';
import { cooldownMiddleware } from '../middleware/cooldown.js';
import { moderationMiddleware } from '../middleware/moderation.js';
import { eventHandler } from './eventHandler.js';
import AuthSystem from './authSystem.js';
import { createBotContext } from '../utils/createBotContext.js';

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

  /**
   * Emit a real-time log to the tenant via WebSocket
   */
  private log(tenantId: string, botId: string, message: string, level: 'info' | 'warn' | 'error' | 'success' = 'info') {
    socketService.emitToTenant(tenantId, 'bot_log', {
      botId,
      message,
      level,
      timestamp: new Date().toISOString()
    });
    // Also mirror to standard logger
    if (level === 'error') logger.error(`[Bot:${botId}] ${message}`);
    else logger.info(`[Bot:${botId}] ${message}`);
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
      if (!canAddResult.success) {
        throw canAddResult.error;
      }
      if (!canAddResult.data) {
        throw new Error('Bot limit exceeded for your current plan.');
      }

      const botId = `bot_${crypto.randomUUID()}`;
      // Destructure botData to exclude createdAt and updatedAt before spreading
      const { createdAt, updatedAt, ...restBotData } = botData;

      const rawData = {
        id: botId,
        name: restBotData.name || 'My Bot',
        status: 'disconnected' as const,
        connectionMetadata: {
          browser: ['WhatsDeX', 'Chrome', '1.0.0'] as [string, string, string],
          platform: 'web'
        },
        stats: {
          messagesSent: 0,
          messagesReceived: 0,
          contactsCount: 0,
          errorsCount: 0
        },
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        ...restBotData
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
        logger.info(`Bot ${botId} is already running`, { tenantId, botId });
        return { success: true, data: undefined };
      }

      // 2026: Unified Auth Logic
      const authSystem = new AuthSystem({ bot: {} }, tenantId, botId);
      this.authSystems.set(botId, authSystem);

      // Fetch Bot Configuration from Firestore
      const configResult = await tenantConfigService.getBotConfig(tenantId, botId);
      const botConfig = configResult.success ? configResult.data : undefined;

      // Handle QR updates
      authSystem.on('qr', async (qr) => {
        try {
          const qrCodeUrl = await QRCode.toDataURL(qr);
          this.qrCodes.set(botId, qrCodeUrl);
        } catch (err) {
          logger.error(`QR Generation failed for ${botId}`, { tenantId, botId, error: err });
        }
      });

      // Handle Disconnection
      authSystem.on('disconnected', async (error) => {
        this.activeBots.delete(botId);
        await this.updateBotStatus(tenantId, botId, 'disconnected');

        const statusCode = (error as any)?.output?.statusCode;
        if (statusCode === DisconnectReason.loggedOut) {
          this.authSystems.delete(botId);
          this.qrCodes.delete(botId);
        }
      });

      // Handle Connection Success
      authSystem.on('connected', async () => {
        logger.info(`Bot ${botId} is CONNECTED`, { tenantId, botId });
        this.qrCodes.delete(botId);
        await this.updateBotStatus(tenantId, botId, 'connected');
        this.log(tenantId, botId, 'Bot instance connected and ready', 'success');

        // Handle Always Online if configured
        if (botConfig?.alwaysOnline) {
          const bot = this.activeBots.get(botId);
          if (bot && bot.sendPresenceUpdate) {
            await bot.sendPresenceUpdate('available');
            logger.debug(`Bot ${botId} set to AVAILABLE (Always Online)`);
          }
        }
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
      socket.config = botConfig!; // Inject dynamic config
      socket.context = await this.getContext();

      socket.use = (mw) => mwSystem.use(mw);
      socket.executeMiddleware = (ctx, next) => mwSystem.execute(ctx, next);

      // Register Default Middleware
      socket.use(cooldownMiddleware);
      socket.use(moderationMiddleware);
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
            this.log(tenantId, botId, `Incoming message from ${message.key.remoteJid}`, 'info');
          }
        }
      });

      logger.info(`Bot ${botId} orchestrator started`, { tenantId, botId });
      return { success: true, data: undefined };

    } catch (error: unknown) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error(`Failed to start bot ${botId}`, { tenantId, botId, error: err });
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
        const status = 'disconnected';

        await this.updateBotStatus(tenantId, botId, status);

        if (shouldReconnect) {
          logger.info(`Bot ${botId} disconnected, reconnecting...`, { tenantId, botId });
          setTimeout(() => this.startBot(tenantId, botId), 5000);
        } else {
          logger.info(`Bot ${botId} logged out.`, { tenantId, botId });
          this.activeBots.delete(botId);
          this.qrCodes.delete(botId);
        }

        // Webhook Dispatch for disconnection
        await webhookService.dispatch(tenantId, 'bot.disconnected', {
          botId,
          status: status,
          reason: lastDisconnect?.error?.message || 'unknown'
        });

      } else if (connection === 'open') {
        const status = 'connected';
        logger.info(`Bot ${botId} is CONNECTED`, { tenantId, botId });
        this.qrCodes.delete(botId);
        await this.updateBotStatus(tenantId, botId, status);

        // Extract and save phone number
        const bot = this.activeBots.get(botId);
        if (bot?.user?.id) {
          if (status === 'connected' && !bot.phoneNumber && (update as any).me?.id) {
            await this.updateBotPhoneNumber(tenantId, botId, (update as any).me.id);
          }
        }

        // Webhook Dispatch
        await webhookService.dispatch(tenantId, 'bot.connected', {
          botId,
          phoneNumber: bot?.phoneNumber, // Use optional chaining as bot might not have phoneNumber yet
          status: status
        });
      }
    } catch (error: unknown) {
      logger.error(`Error handling connection update for ${botId}`, { tenantId, botId, error });
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
        // Enforce Feature Flag: Check if AI is enabled for this tenant
        const isAiEnabled = await tenantConfigService.isFeatureEnabled(tenantId, 'aiEnabled');

        if (isAiEnabled) {
          // Create context for AI processing
          const aiCtx = await createBotContext(bot, message, context);
          // 2. Process via AI/Brain
          await context.unifiedAI.processMessage(bot, aiCtx);

          // 3. Webhook Dispatch
          await webhookService.dispatch(tenantId, 'message.received', {
            botId,
            sender: aiCtx.sender.jid,
            message: aiCtx.message?.conversation || aiCtx.message?.extendedTextMessage?.text || '',
            timestamp: Date.now()
          });
        }
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
    ).catch(err => logger.error(`Failed to update bot status ${botId}:`, err));
  }

  /**
   * Helper to update bot phone number in Firestore
   */
  private async updateBotPhoneNumber(tenantId: string, botId: string, phoneNumber: string): Promise<void> {
    try {
      await firebaseService.setDoc<'tenants/{tenantId}/bots'>(
        'bots',
        botId,
        { phoneNumber, updatedAt: Timestamp.now() },
        tenantId,
        true
      );
    } catch (error) {
      logger.error(`Failed to update bot phone number ${botId}:`, error);
    }
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

  /**
   * Get all bots for a tenant from Firestore
   */
  async getAllBots(tenantId: string): Promise<Result<BotInstance[]>> {
    try {
      const bots = await firebaseService.getCollection<'tenants/{tenantId}/bots'>('bots', tenantId);

      // Enrich with active status from memory if needed
      const enrichedBots = bots.map(bot => {
        const isActive = this.hasActiveBot(bot.id);
        // If active in memory, status should be 'connected' or 'connecting'
        // If not active in memory, status should be 'disconnected' (or 'disconnected')
        // We trust Firestore status mostly, but we can override if we know it's active.

        let status = bot.status;
        if (isActive && (status === 'disconnected' || status === 'error')) {
          status = 'connected'; // Fallback if Firestore wasn't updated
        } else if (!isActive && status === 'connected') {
          status = 'disconnected'; // Fallback if it crashed without updating Firestore
        }

        return {
          ...bot,
          status,
          createdAt: (bot.createdAt as any)?.toDate?.() || bot.createdAt,
          updatedAt: (bot.updatedAt as any)?.toDate?.() || bot.updatedAt,
          lastSeenAt: (bot.lastSeenAt as any)?.toDate?.() || bot.lastSeenAt,
          stats: {
            ...bot.stats,
            lastMessageAt: (bot.stats?.lastMessageAt as any)?.toDate?.() || bot.stats?.lastMessageAt,
          },
        };
      });

      return { success: true, data: enrichedBots };
    } catch (error: unknown) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error(`getAllBots error [${tenantId}]:`, err);
      return { success: false, error: err };
    }
  }

  /**
   * Get a single bot from Firestore
   */
  async getBot(tenantId: string, botId: string): Promise<Result<BotInstance>> {
    try {
      const doc = await firebaseService.getDoc<'tenants/{tenantId}/bots'>('bots', botId, tenantId);
      if (!doc) {
        return { success: false, error: new Error('Bot not found') };
      }
      return { success: true, data: doc as BotInstance };
    } catch (error: unknown) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error(`getBot error [${tenantId}/${botId}]:`, err);
      return { success: false, error: err };
    }
  }

  /**
   * Update a bot in Firestore
   */
  async updateBot(tenantId: string, botId: string, data: Partial<BotInstance>): Promise<Result<BotInstance>> {
    try {
      const updateData = {
        ...data,
        updatedAt: Timestamp.now()
      };
      await firebaseService.setDoc<'tenants/{tenantId}/bots'>('bots', botId, updateData, tenantId, true);

      const updated = await this.getBot(tenantId, botId);
      if (updated.success) {
        // Ensure Date conversion for the returned object
        const bot = updated.data;
        return {
          success: true,
          data: {
            ...bot,
            createdAt: (bot.createdAt as any)?.toDate?.() || bot.createdAt,
            updatedAt: (bot.updatedAt as any)?.toDate?.() || bot.updatedAt,
            lastSeenAt: (bot.lastSeenAt as any)?.toDate?.() || bot.lastSeenAt,
            stats: {
              ...bot.stats,
              lastMessageAt: (bot.stats?.lastMessageAt as any)?.toDate?.() || bot.stats?.lastMessageAt,
            },
          } as BotInstance
        };
      }
      return updated;
    } catch (error: unknown) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error(`updateBot error [${tenantId}/${botId}]:`, err);
      return { success: false, error: err };
    }
  }

  /**
   * Delete a bot from Firestore and stop it if active
   */
  async deleteBot(tenantId: string, botId: string): Promise<Result<void>> {
    try {
      // Stop the bot if it's active
      if (this.activeBots.has(botId)) {
        await this.stopBot(botId);
      }

      await firebaseService.deleteDoc<'tenants/{tenantId}/bots'>('bots', botId, tenantId);
      return { success: true, data: undefined };
    } catch (error: unknown) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error(`deleteBot error [${tenantId}/${botId}]:`, err);
      return { success: false, error: err };
    }
  }

  /**
   * Get the QR code for a bot
   */
  getBotQR(botId: string): string | null {
    return this.qrCodes.get(botId) || null;
  }

  async stopAllBots(): Promise<void> {

    logger.info('Stopping all active bots...');
    for (const botId of this.activeBots.keys()) {
      await this.stopBot(botId);
    }
  }

  /**
   * Send a message via a specific bot
   */
  async sendMessage(tenantId: string, botId: string, payload: {
    to: string;
    text: string;
    type: 'text' | 'image' | 'video' | 'document';
    url?: string;
    caption?: string;
    typingDelay?: number;
  }): Promise<Result<any>> {
    try {
      const bot = this.activeBots.get(botId);
      if (!bot) {
        return { success: false, error: new Error('Bot is not online') };
      }

      // Basic JID formatting
      const jid = payload.to.includes('@s.whatsapp.net') ? payload.to : `${payload.to}@s.whatsapp.net`;

      let result;
      if (payload.type === 'text') {
        // Human Path: Simulate typing if requested
        if (payload.typingDelay && payload.typingDelay > 0) {
          await bot.sendPresenceUpdate?.('composing', jid);
          await new Promise(r => setTimeout(r, payload.typingDelay));
          await bot.sendPresenceUpdate?.('paused', jid);
        }

        result = await bot.sendMessage(jid, { text: payload.text });
      } else if (['image', 'video', 'document'].includes(payload.type) && payload.url) {
        // Media message
        result = await bot.sendMessage(jid, {
          [payload.type]: { url: payload.url },
          caption: payload.caption || payload.text
        } as any);
      } else {
        return { success: false, error: new Error('Invalid message type or missing URL') };
      }

      await this.incrementBotStat(tenantId, botId, 'messagesSent');
      return { success: true, data: result };
    } catch (error: unknown) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error(`sendMessage error [${botId}]:`, err);
      // Increment error stat
      await this.incrementBotStat(tenantId, botId, 'errorsCount');
      return { success: false, error: err };
    }
  }

  /**
   * Request Pairing Code for a bot
   */
  async requestPairingCode(tenantId: string, botId: string, phoneNumber: string): Promise<Result<string>> {
    try {
      const authSystem = this.authSystems.get(botId);
      if (!authSystem) {
        // If not running, start it first
        await this.startBot(tenantId, botId);
        // Wait a bit for initialization? Or startBot returns when ready?
        // startBot returns void, but we might need to wait for client init inside AuthSystem.
        // Let's assume startBot initializes enough for us to get the system.
      }

      const activeAuthSystem = this.authSystems.get(botId);
      if (!activeAuthSystem) {
        return { success: false, error: new Error('Failed to initialize auth system') };
      }

      return await activeAuthSystem.getPairingCode(phoneNumber);
    } catch (error: unknown) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error(`requestPairingCode error [${botId}]:`, err);
      return { success: false, error: err };
    }
  }
}

export const multiTenantBotService = MultiTenantBotService.getInstance();
export default multiTenantBotService;
