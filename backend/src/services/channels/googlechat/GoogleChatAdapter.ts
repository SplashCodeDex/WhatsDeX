import { type ChannelAdapter, type InboundMessageEvent, type ChannelId } from "../ChannelAdapter.js";
import { CommonMessage } from "../../../types/omnichannel.js";
import logger from "@/utils/logger.js";

/**
 * Adapter for Google Chat integration.
 */
export class GoogleChatAdapter implements ChannelAdapter {
  public readonly id: ChannelId = "googlechat";
  public readonly instanceId: string;
  private messageHandler: ((event: InboundMessageEvent) => Promise<void>) | null = null;

  constructor(
    private tenantId: string,
    private channelId: string,
    private credentials: Record<string, any>
  ) {
    this.instanceId = this.channelId;
  }

  async initialize(): Promise<void> {
    logger.info(`[GoogleChatAdapter] Initializing for ${this.channelId}`);
  }

  async connect(): Promise<void> {
    logger.info(`[GoogleChatAdapter] Connected for channel ${this.channelId}`);
  }

  async disconnect(): Promise<void> {
    logger.info(`[GoogleChatAdapter] Disconnected`);
  }

  async shutdown(): Promise<void> {
    await this.disconnect();
  }

  async sendMessage(target: string, content: any): Promise<void> {
    const text = typeof content === 'string' ? content : content.text || JSON.stringify(content);

    // Google Chat usually requires OAuth2 or Webhooks.
    // This is a placeholder for the actual API call using the credentials.
    logger.info(`[GoogleChatAdapter] Would send to ${target}: ${text}`);
  }

  public async sendCommon(message: CommonMessage): Promise<void> {
    if (!message.content.text) return;
    await this.sendMessage(message.to, message.content.text);
  }

  public onMessage(handler: (event: InboundMessageEvent) => Promise<void>): void {
    this.messageHandler = handler;
  }
}
