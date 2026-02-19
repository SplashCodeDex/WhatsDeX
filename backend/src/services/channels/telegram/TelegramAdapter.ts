import { Bot } from "grammy";
import { type ChannelAdapter, type InboundMessageEvent, type ChannelId } from "../ChannelAdapter.js";
// @ts-ignore
import { sendMessageTelegram } from "../../../../../openclaw/src/telegram/send.js";
import { CommonMessage } from "../../../types/omnichannel.js";
import logger from "@/utils/logger.js";

/**
 * Adapter for Telegram integration using OpenClaw's engine.
 */
export class TelegramAdapter implements ChannelAdapter {
  public readonly id: ChannelId = "telegram";
  public readonly instanceId: string;
  private bot: Bot | null = null;
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
    if (this.bot) return;

    this.bot = new Bot(this.token);
    await this.bot.init();
    
    // Setup message listener
    this.bot.on('message', async (ctx) => {
      if (this.messageHandler) {
        await this.messageHandler({
          tenantId: this.tenantId,
          channelId: this.id,
          botId: this.botId,
          sender: ctx.from?.username || ctx.from?.id.toString() || 'unknown',
          content: ctx.message.text,
          timestamp: new Date(ctx.message.date * 1000),
          raw: ctx.message
        });
      }
    });

    // Start polling for dev/test
    this.bot.start().catch(err => {
      logger.error(`[TelegramAdapter] Polling error for ${this.botId}:`, err);
    });

    logger.info(`[TelegramAdapter] Connected as @${this.bot.botInfo.username}`);
  }

  async disconnect(): Promise<void> {
    if (this.bot) {
      await this.bot.stop();
      this.bot = null;
    }
  }

  async shutdown(): Promise<void> {
    await this.disconnect();
  }

  async sendMessage(target: string, content: any): Promise<void> {
    if (!this.bot) {
      throw new Error("TelegramAdapter not connected");
    }

    const text = typeof content === "string" ? content : content.text;

    // Use OpenClaw's robust send logic
    // Signature: sendMessageTelegram(to: string, text: string, opts: TelegramSendOpts)
    await sendMessageTelegram(target, text, {
      token: this.token,
      api: this.bot.api,
      textMode: "markdown",
    });
  }

  public async sendCommon(message: CommonMessage): Promise<void> {
    if (!message.content.text) return;

    // OpenClaw's sendMessageTelegram handles Markdown formatting when textMode: 'markdown' is passed
    await this.sendMessage(message.to, message.content.text);
  }

  public onMessage(handler: (event: InboundMessageEvent) => Promise<void>): void {
    this.messageHandler = handler;
  }
}
