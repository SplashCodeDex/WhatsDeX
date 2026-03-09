import { sendMessageSlack } from 'openclaw';
import { type ChannelAdapter, type InboundMessageEvent, type ChannelId } from "../ChannelAdapter.js";
import { CommonMessage } from "../../../types/omnichannel.js";
import logger from "@/utils/logger.js";

/**
 * Adapter for Slack integration.
 */
export class SlackAdapter implements ChannelAdapter {
  public readonly id: ChannelId = "slack";
  public readonly instanceId: string;
  private messageHandler: ((event: InboundMessageEvent) => Promise<void>) | null = null;

  constructor(
    private tenantId: string,
    private channelId: string,
    private token: string
  ) {
    this.instanceId = this.channelId;
  }

  async initialize(): Promise<void> {
    logger.info(`[SlackAdapter] Initializing for ${this.channelId}`);
  }

  async connect(): Promise<void> {
    // In OpenClaw, Slack is often handled via the gateway or direct calls.
    // For a persistent listener, we might need to hook into OpenClaw's monitor.
    logger.info(`[SlackAdapter] Connected for channel ${this.channelId}`);
  }

  async disconnect(): Promise<void> {
    logger.info(`[SlackAdapter] Disconnected`);
  }

  async shutdown(): Promise<void> {
    await this.disconnect();
  }

  async sendMessage(target: string, content: any): Promise<void> {
    const text = typeof content === 'string' ? content : content.text || JSON.stringify(content);
    await sendMessageSlack(target, text, {
      token: this.token
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
