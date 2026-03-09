import { sendMessageSignal } from 'openclaw';
import { type ChannelAdapter, type InboundMessageEvent, type ChannelId } from "../ChannelAdapter.js";
import { CommonMessage } from "../../../types/omnichannel.js";
import logger from "@/utils/logger.js";

/**
 * Adapter for Signal integration.
 */
export class SignalAdapter implements ChannelAdapter {
  public readonly id: ChannelId = "signal";
  public readonly instanceId: string;
  private messageHandler: ((event: InboundMessageEvent) => Promise<void>) | null = null;

  constructor(
    private tenantId: string,
    private channelId: string,
    private phoneNumber: string
  ) {
    this.instanceId = this.channelId;
  }

  async initialize(): Promise<void> {
    logger.info(`[SignalAdapter] Initializing for ${this.phoneNumber}`);
  }

  async connect(): Promise<void> {
    logger.info(`[SignalAdapter] Connected for channel ${this.channelId}`);
  }

  async disconnect(): Promise<void> {
    logger.info(`[SignalAdapter] Disconnected`);
  }

  async shutdown(): Promise<void> {
    await this.disconnect();
  }

  async sendMessage(target: string, content: any): Promise<void> {
    const text = typeof content === 'string' ? content : content.text || JSON.stringify(content);
    await sendMessageSignal(target, text, {
      accountId: this.phoneNumber // In OpenClaw Signal accountId is often the phone
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
