import { sendMessageIMessage } from 'openclaw/src/index.js';
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

  constructor(
    private tenantId: string,
    private channelId: string,
    private identifier: string
  ) {
    this.instanceId = this.channelId;
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
}
