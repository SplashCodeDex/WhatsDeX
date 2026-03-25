import { type ChannelAdapter, type InboundMessageEvent, type ChannelId } from "../ChannelAdapter.js";
import { CommonMessage } from "../../../types/omnichannel.js";
import logger from "@/utils/logger.js";

/**
 * Adapter for IRC integration.
 */
export class IRCAdapter implements ChannelAdapter {
  public readonly id: ChannelId = "irc";
  public readonly instanceId: string;
  private messageHandler: ((event: InboundMessageEvent) => Promise<void>) | null = null;

  private config: Record<string, any>;
  public fullPath?: string;

  constructor(
    private tenantId: string,
    private channelId: string,
    fullPath: string | undefined,
    channelData: any
  ) {
    this.instanceId = channelId;
    this.fullPath = fullPath;
    this.config = channelData?.credentials || {};
  }

  async initialize(): Promise<void> {
    logger.info(`[IRCAdapter] Initializing for ${this.channelId}`);
  }

  async connect(): Promise<void> {
    logger.info(`[IRCAdapter] Connected for channel ${this.channelId}`);
  }

  async disconnect(): Promise<void> {
    logger.info(`[IRCAdapter] Disconnected`);
  }

  async shutdown(): Promise<void> {
    await this.disconnect();
  }

  async sendMessage(target: string, content: any): Promise<void> {
    const text = typeof content === 'string' ? content : content.text || JSON.stringify(content);
    logger.info(`[IRCAdapter] Would send to ${target}: ${text}`);
    throw new Error('IRCAdapter.sendMessage is currently a placeholder and not fully implemented.');
  }

  public async sendCommon(message: CommonMessage): Promise<void> {
    if (!message.content.text) return;
    await this.sendMessage(message.to, message.content.text);
  }

  public onMessage(handler: (event: InboundMessageEvent) => Promise<void>): void {
    this.messageHandler = handler;
  }

  public async handleWebhook(req: any, res: any): Promise<void> {
    if (!this.messageHandler) return res.status(200).send('OK');
    try {
      const payload = req.body;
      if (!payload) return res.status(400).send('Bad Request');
      
      const text = payload.text || payload.message;
      const sender = payload.sender || payload.nick || payload.user;
      const messageId = payload.id || req.headers['x-request-id'] || crypto.randomUUID();

      if (text && sender) {
        const event: InboundMessageEvent = {
          tenantId: this.tenantId,
          channelId: this.instanceId,
          channelType: this.id as ChannelId,
          fullPath: this.fullPath,
          sender,
          content: text,
          timestamp: new Date(),
          raw: { ...payload, id: messageId }
        };
        await this.messageHandler(event);
      }
      res.status(200).send('OK');
    } catch (error) {
      logger.error(`[IRCAdapter] Error processing inbound webhook:`, error);
      res.status(500).send('Error');
    }
  }
}
