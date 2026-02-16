import { ChannelAdapter, InboundMessageEvent } from '../ChannelAdapter.js';
import AuthSystem from '@/services/authSystem.js';
import logger from '@/utils/logger.js';

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

  constructor(private tenantId: string, private botId: string) {
    this.instanceId = botId;
    this.authSystem = new AuthSystem({ bot: {} }, tenantId, botId);
  }

  public async initialize(): Promise<void> {
    // Basic init if needed
  }

  public async connect(): Promise<void> {
    logger.info(`Connecting WhatsappAdapter for bot ${this.botId}`);
    
    const connectResult = await this.authSystem.connect();
    if (!connectResult.success) {
      throw connectResult.error;
    }

    this.socket = connectResult.data;

    // Listen for messages
    this.socket.ev.on('messages.upsert', async ({ messages, type }: any) => {
      if (type === 'notify' && this.messageHandler) {
        for (const message of messages) {
          await this.messageHandler({
            tenantId: this.tenantId,
            channelId: this.id,
            botId: this.botId,
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
    
    // Support simple text or full Baileys content object
    const payload = typeof content === 'string' ? { text: content } : content;
    await this.socket.sendMessage(jid, payload);
  }

  public onMessage(handler: (event: InboundMessageEvent) => Promise<void>): void {
    this.messageHandler = handler;
  }
}
