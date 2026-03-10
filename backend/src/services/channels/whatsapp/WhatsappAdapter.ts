import { CommonMessage } from '../../../types/omnichannel.js';
import { ChannelAdapter, InboundMessageEvent } from '../ChannelAdapter.js';
import AuthSystem from '@/services/authSystem.js';
import logger from '@/utils/logger.js';
import { eventHandler } from '@/services/eventHandler.js';
import QRCode from 'qrcode';
import { MiddlewareSystem } from '@/services/middlewareSystem.js';
import { Channel } from '../../../types/contracts.js';
import { ActiveChannel, MessageContext, Middleware } from '../../../types/index.js';

// Import from openclaw workspace package
import {
  sendMessageWhatsApp,
  sendReactionWhatsApp,
  sendPollWhatsApp,
  setActiveWebListener,
  type ActiveWebListener,
  type ActiveWebSendOptions
} from 'openclaw';

/**
 * WhatsappAdapter wraps the existing DeXMart Baileys/AuthSystem logic
 * to conform to the ChannelAdapter interface.
 */
export class WhatsappAdapter implements ChannelAdapter, Partial<ActiveChannel> {
  public readonly id = 'whatsapp';
  public readonly instanceId: string;
  public readonly fullPath?: string;
  private authSystem: AuthSystem;
  private messageHandler: ((event: InboundMessageEvent) => Promise<void>) | null = null;
  private socket: any = null;
  private qrCodeUrl: string | null = null;
  private middlewareSystem = new MiddlewareSystem();
  public config: any = {}; // Holds channel settings like selfMode, alwaysOnline
  public channelId: string; // Map instanceId to channelId for index.ts Channel type
  public context: any; // Injected GlobalContext
  private presenceInterval: NodeJS.Timeout | null = null;

  constructor(public tenantId: string, channelId: string, fullPath?: string, channelData?: Partial<Channel>) {
    this.instanceId = channelId;
    this.channelId = channelId;
    this.fullPath = fullPath;
    this.config = channelData?.config || {};

    // Resolve the partial path for session storage (agents/A/channels/C)
    let collectionOrPath = 'channels';
    if (fullPath && fullPath.includes('/agents/')) {
      const parts = fullPath.split('/');
      // Extract 'agents/{agentId}/channels'
      collectionOrPath = `agents/${parts[3]}/channels`;
    }

    this.authSystem = new AuthSystem({ channel: {} }, tenantId, channelId, collectionOrPath);
  }

  // CHANNEL INTERFACE IMPLEMENTATION
  public use(middleware: Middleware): void {
    this.middlewareSystem.use(middleware);
  }

  public async executeMiddleware(ctx: MessageContext, next: () => Promise<void>): Promise<void> {
    await this.middlewareSystem.execute(ctx, next);
  }

  /**
   * Inject GlobalContext for bridge compatibility
   */
  public setContext(context: any) {
    this.context = context;
  }

  public async initialize(): Promise<void> {
    // Basic init if needed
  }

  public async connect(): Promise<void> {
    logger.info(`Connecting WhatsappAdapter for channel ${this.channelId} (Path: ${this.fullPath || 'legacy'})`);

    const connectResult = await this.authSystem.connect();
    if (!connectResult.success) {
      throw connectResult.error;
    }

    this.socket = connectResult.data;

    // MASTERMIND Goodie: Bind EventHandler for Anti-Call and Group Sync
    eventHandler.bind(this.socket);

    // MASTERMIND Goodie: Listen for QR codes and convert to DataURL for UI
    this.authSystem.on('qr', async (qr) => {
      try {
        this.qrCodeUrl = await QRCode.toDataURL(qr);
      } catch (err) {
        logger.error('Failed to generate QR DataURL', err);
      }
    });

    // MASTERMIND Goodie: Forward AuthSystem status updates to ChannelService
    this.authSystem.on('status', async (status) => {
      try {
        const { channelService } = await import('@/services/ChannelService.js');
        let agentId = 'system_default';
        if (this.fullPath && this.fullPath.includes('/agents/')) {
          agentId = this.fullPath.split('/')[3];
        }
        await channelService.updateStatus(this.tenantId, this.channelId, status, agentId);
      } catch (err) {
        logger.error(`Failed to forward status '${status}' for ${this.channelId}`, err);
      }
    });

    // MASTERMIND Goodie: Automatic Phone Number Discovery
    this.socket.ev.on('connection.update', async (update: any) => {
      if (update.connection === 'open' && update.me?.id) {
        this.qrCodeUrl = null; // Clear QR on success
        const phoneNumber = update.me.id.split(':')[0];
        logger.info(`Channel ${this.channelId} connected with number: ${phoneNumber}`);

        // --- ALWAYS ONLINE LOGIC ---
        if (this.config.alwaysOnline) {
          logger.info(`[WhatsappAdapter] Enabling AlwaysOnline for ${this.channelId}`);
          await this.socket.sendPresenceUpdate('available');

          // Periodic keep-alive
          if (this.presenceInterval) clearInterval(this.presenceInterval);
          this.presenceInterval = setInterval(async () => {
            try {
              if (this.socket) await this.socket.sendPresenceUpdate('available');
            } catch (e) {
              logger.warn(`[WhatsappAdapter] Failed to send keep-alive for ${this.channelId}`, e);
            }
          }, 5 * 60 * 1000); // 5 minutes
        }

        try {
          const { channelService } = await import('@/services/ChannelService.js');
          let agentId = 'system_default';
          if (this.fullPath && this.fullPath.includes('/agents/')) {
            agentId = this.fullPath.split('/')[3];
          }
          await channelService.updateChannel(this.tenantId, this.channelId, { phoneNumber }, agentId);
        } catch (e) {
          logger.error(`Failed to update discovered phone number for ${this.channelId}`, e);
        }
      }
    });

    // Register active web listener for OpenClaw's outbound pipeline
    const listener: ActiveWebListener = {
      sendMessage: async (to: string, text: string, mediaBuffer?: Buffer, mediaType?: string, options?: ActiveWebSendOptions) => {
        const payload: any = {};
        if (mediaBuffer && mediaType) {
          if (mediaType.startsWith('image/')) {
            payload.image = mediaBuffer;
            payload.caption = text;
          } else if (mediaType.startsWith('video/')) {
            payload.video = mediaBuffer;
            payload.caption = text;
            if (options?.gifPlayback) payload.gifPlayback = true;
          } else if (mediaType.startsWith('audio/')) {
            payload.audio = mediaBuffer;
          } else {
            payload.document = mediaBuffer;
            payload.mimetype = mediaType;
            payload.fileName = options?.fileName || 'document';
            payload.caption = text;
          }
        } else {
          payload.text = text;
        }
        const result = await this.socket.sendMessage(to, payload);

        // Track stats
        try {
          const { channelService } = await import('@/services/ChannelService.js');
          let agentId = 'system_default';
          if (this.fullPath && this.fullPath.includes('/agents/')) {
            agentId = this.fullPath.split('/')[3];
          }
          await channelService.incrementChannelStat(this.tenantId, this.channelId, 'messagesSent', agentId);
        } catch (e) {
          logger.warn('Failed to increment stats in WhatsappAdapter', e);
        }

        return { messageId: result?.key?.id || '' };
      },
      sendPoll: async (to: string, poll: any) => {
        const result = await this.socket.sendMessage(to, {
          poll: {
            name: poll.question,
            values: poll.options.map((opt: any) => typeof opt === 'string' ? opt : opt.name),
            selectableCount: poll.maxSelections || 1,
          }
        });
        return { messageId: result?.key?.id || '' };
      },
      sendReaction: async (chatJid: string, messageId: string, emoji: string, fromMe: boolean, participant?: string) => {
        await this.socket.sendMessage(chatJid, { react: { text: emoji, key: { id: messageId, fromMe, remoteJid: chatJid, participant } } });
      },
      sendComposingTo: async (to: string) => {
        await this.socket.sendPresenceUpdate('composing', to);
      },
    };
    setActiveWebListener(this.channelId, listener);

    // Listen for messages
    this.socket.ev.on('messages.upsert', async ({ messages, type }: any) => {
      if (type === 'notify' && this.messageHandler) {
        for (const message of messages) {
          // Ignore messages sent by the bot itself unless selfMode is enabled
          if (message.key.fromMe && !this.config?.selfMode) {
            continue;
          }
          await this.messageHandler({
            tenantId: this.tenantId,
            channelId: this.id,
            fullPath: this.fullPath,
            sender: message.key.remoteJid,
            content: message.message,
            timestamp: new Date((message.messageTimestamp as number) * 1000),
            raw: message
          });
        }
      }
    });
  }

  public async disconnect(): Promise<void> {
    if (this.presenceInterval) {
      clearInterval(this.presenceInterval);
      this.presenceInterval = null;
    }
    setActiveWebListener(this.channelId, null);
    await this.authSystem.disconnect();
    this.socket = null;
  }

  public async shutdown(): Promise<void> {
    await this.disconnect();
  }

  public async sendMessage(target: string, content: any): Promise<void> {
    if (!this.socket) {
      throw new Error('Adapter not connected');
    }

    const jid = target.includes('@s.whatsapp.net') ? target : `${target}@s.whatsapp.net`;

    const text = typeof content === 'string' ? content : (content.text || '');
    const mediaUrl = content.mediaUrl;

    // MASTERMIND Goodie: Human-like Presence (Typing Simulation)
    if (text && text.length > 0) {
      // Calculate delay: ~50ms per character, capped at 3 seconds
      const typingDelay = Math.min(text.length * 50, 3000);
      try {
        await this.socket.sendPresenceUpdate('composing', jid);
        await new Promise(r => setTimeout(r, typingDelay));
        await this.socket.sendPresenceUpdate('paused', jid);
      } catch (e) {
        logger.warn(`Failed to send presence update for ${jid}`, e);
      }
    }

    // Leverage OpenClaw's rich pipeline
    await sendMessageWhatsApp(jid, text, {
      verbose: false,
      accountId: this.channelId,
      mediaUrl
    });

    // Track stats
    try {
      const { channelService } = await import('@/services/ChannelService.js');
      let agentId = 'system_default';
      if (this.fullPath && this.fullPath.includes('/agents/')) {
        agentId = this.fullPath.split('/')[3];
      }
      await channelService.incrementChannelStat(this.tenantId, this.channelId, 'messagesSent', agentId);
    } catch (e) {
      logger.warn('Failed to increment stats in WhatsappAdapter', e);
    }
  }

  public async sendReaction(chatJid: string, messageId: string, emoji: string): Promise<void> {
    if (!this.socket) throw new Error('Adapter not connected');
    await sendReactionWhatsApp(chatJid, messageId, emoji, {
      verbose: false,
      accountId: this.channelId
    });
  }

  public async sendPoll(to: string, question: string, options: string[]): Promise<void> {
    if (!this.socket) throw new Error('Adapter not connected');
    const jid = to.includes('@s.whatsapp.net') ? to : `${to}@s.whatsapp.net`;
    await sendPollWhatsApp(jid, { question, options }, {
      verbose: false,
      accountId: this.channelId
    });
  }

  public async sendCommon(message: CommonMessage): Promise<void> {
    // Phase 1.3: Robust formatting is handled by OpenClaw's convertMarkdownTables and markdownToWhatsApp automatically!
    await this.sendMessage(message.to, {
      text: message.content.text || '',
      mediaUrl: message.content.attachments?.[0]?.url
    });
  }

  public onMessage(handler: (event: InboundMessageEvent) => Promise<void>): void {
    this.messageHandler = handler;
  }

  /**
   * Get the current QR code image URL
   */
  public getQR(): string | null {
    return this.qrCodeUrl;
  }

  /**
   * Request a pairing code
   */
  public async requestPairingCode(phoneNumber: string): Promise<string> {
    const result = await this.authSystem.getPairingCode(phoneNumber);
    if (!result.success) throw result.error;
    return result.data;
  }
}
