import { CommonMessage } from '../../../types/omnichannel.js';
import { ChannelAdapter, InboundMessageEvent } from '../ChannelAdapter.js';
import AuthSystem from '@/services/authSystem.js';
import logger from '@/utils/logger.js';

// @ts-ignore
import { sendMessageWhatsApp, sendReactionWhatsApp, sendPollWhatsApp } from '../../../../../openclaw/src/web/outbound.js';
// @ts-ignore
import { setActiveWebListener, type ActiveWebListener, type ActiveWebSendOptions } from '../../../../../openclaw/src/web/active-listener.js';

/**
 * WhatsappAdapter wraps the existing WhatsDeX Baileys/AuthSystem logic
 * to conform to the ChannelAdapter interface.
 */
export class WhatsappAdapter implements ChannelAdapter {
  public readonly id = 'whatsapp';
  public readonly instanceId: string;
  private authSystem: AuthSystem;
  private messageHandler: ((event: InboundMessageEvent) => Promise<void>) | null = null;
  private socket: any = null;

  constructor(private tenantId: string, private channelId: string) {
    this.instanceId = channelId;
    this.authSystem = new AuthSystem({ bot: {} }, tenantId, channelId);
  }

  public async initialize(): Promise<void> {
    // Basic init if needed
  }

  public async connect(): Promise<void> {
    logger.info(`Connecting WhatsappAdapter for channel ${this.channelId}`);

    const connectResult = await this.authSystem.connect();
    if (!connectResult.success) {
      throw connectResult.error;
    }

    this.socket = connectResult.data;

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
          await this.messageHandler({
            tenantId: this.tenantId,
            channelId: this.id,
            botId: this.channelId, // Keep botId in event for backward compat or update interface later
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

    // Leverage OpenClaw's rich pipeline
    await sendMessageWhatsApp(jid, text, {
      verbose: false,
      accountId: this.channelId,
      mediaUrl
    });
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
}
