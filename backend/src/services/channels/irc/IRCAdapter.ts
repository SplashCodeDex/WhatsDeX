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

  constructor(
    private tenantId: string,
    private botId: string,
    private config: Record<string, any>
  ) {
    this.instanceId = botId;
  }

  async initialize(): Promise<void> {
    logger.info(`[IRCAdapter] Initializing for ${this.botId}`);
  }

  async connect(): Promise<void> {
    logger.info(`[IRCAdapter] Connected for bot ${this.botId}`);
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
  }

  public async sendCommon(message: CommonMessage): Promise<void> {
    if (!message.content.text) return;
    await this.sendMessage(message.to, message.content.text);
  }

  public onMessage(handler: (event: InboundMessageEvent) => Promise<void>): void {
    this.messageHandler = handler;
  }
}
