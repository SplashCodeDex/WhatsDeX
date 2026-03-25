import { getIMessageSend } from '@/utils/openclawImports.js';
import { type ChannelAdapter, type InboundMessageEvent, type ChannelId } from "../ChannelAdapter.js";
import { CommonMessage } from "../../../types/omnichannel.js";
import logger from "@/utils/logger.js";

/**
 * Adapter for iMessage integration.
 */
export class IMessageAdapter implements ChannelAdapter {
  public readonly id: ChannelId = "imessage";
  public readonly instanceId: string;
  private messageHandler: ((event: InboundMessageEvent) => Promise<void>) | null = null;

  private identifier: string;
  public fullPath?: string;

  constructor(
    private tenantId: string,
    private channelId: string,
    fullPath: string | undefined,
    channelData: any
  ) {
    this.instanceId = channelId;
    this.fullPath = fullPath;
    this.identifier = channelData?.identifier || channelData?.credentials?.identifier || '';
    if (!this.identifier) throw new Error('Missing iMessage identifier in channelData');
  }

  async initialize(): Promise<void> {
    logger.info(`[IMessageAdapter] Initializing for ${this.identifier}`);
  }

  async connect(): Promise<void> {
    logger.info(`[IMessageAdapter] Connected for channel ${this.channelId}`);
  }

  async disconnect(): Promise<void> {
    logger.info(`[IMessageAdapter] Disconnected`);
  }

  async shutdown(): Promise<void> {
    await this.disconnect();
  }

  async sendMessage(target: string, content: any): Promise<void> {
    const text = typeof content === 'string' ? content : content.text || JSON.stringify(content);
    const { sendMessageIMessage } = await getIMessageSend();
    await sendMessageIMessage(target, text, {
      accountId: this.identifier
    });
  }

  public async sendCommon(message: CommonMessage): Promise<void> {
    if (!message.content.text) return;
    await this.sendMessage(message.to, message.content.text);
  }

  public onMessage(handler: (event: InboundMessageEvent) => Promise<void>): void {
    this.messageHandler = handler;
  }

  public async handleWebhook(req: any, res: any): Promise<void> {
    if (!this.messageHandler) {
      res.status(200).send('OK');
      return;
    }
    try {
      const payload = req.body;
      if (!payload) return res.status(400).send('Bad Request');
      const text = payload.text || payload.message;
      const sender = payload.sender || payload.handle;
      const messageId = payload.guid || req.headers['x-request-id'] || crypto.randomUUID();

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
      logger.error(`[IMessageAdapter] Error processing inbound webhook:`, error);
      res.status(500).send('Error');
    }
  }
}
