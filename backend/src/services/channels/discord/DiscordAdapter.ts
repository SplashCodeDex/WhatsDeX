import { Client, GatewayIntentBits } from "discord.js";
import { type ChannelAdapter, type InboundMessageEvent, type ChannelId } from "../ChannelAdapter.js";
import logger from "@/utils/logger.js";

/**
 * Adapter for Discord integration.
 */
export class DiscordAdapter implements ChannelAdapter {
  public readonly id: ChannelId = "discord";
  public readonly instanceId: string;
  private client: Client | null = null;
  private messageHandler: ((event: InboundMessageEvent) => Promise<void>) | null = null;

  constructor(
    private tenantId: string,
    private botId: string,
    private token: string
  ) {
    this.instanceId = botId;
  }

  async initialize(): Promise<void> {
    // Basic init
  }

  async connect(): Promise<void> {
    if (this.client) return;

    this.client = new Client({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
      ],
    });

    this.client.on("messageCreate", async (message) => {
      if (message.author.bot) return;
      
      if (this.messageHandler) {
        await this.messageHandler({
          tenantId: this.tenantId,
          channelId: this.id,
          botId: this.botId,
          sender: message.author.username,
          content: message.content,
          timestamp: message.createdAt,
          raw: message
        });
      }
    });

    await this.client.login(this.token);
    logger.info(`[DiscordAdapter] Connected as ${this.client.user?.tag}`);
  }

  async disconnect(): Promise<void> {
    if (this.client) {
      this.client.destroy();
      this.client = null;
    }
  }

  async shutdown(): Promise<void> {
    await this.disconnect();
  }

  async sendMessage(target: string, content: any): Promise<void> {
    if (!this.client) {
      throw new Error("DiscordAdapter not connected");
    }

    const channel = await this.client.channels.fetch(target);
    if (channel && 'send' in channel) {
      const payload = typeof content === 'string' ? { content } : content;
      await (channel as any).send(payload);
    } else {
      throw new Error(`Invalid Discord channel ID: ${target}`);
    }
  }

  public onMessage(handler: (event: InboundMessageEvent) => Promise<void>): void {
    this.messageHandler = handler;
  }
}
