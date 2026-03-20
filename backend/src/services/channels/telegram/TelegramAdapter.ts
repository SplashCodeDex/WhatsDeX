import { Bot, webhookCallback } from "grammy";
import { type ChannelAdapter, type InboundMessageEvent, type ChannelId } from "../ChannelAdapter.js";
import { getTelegramSend } from '@/utils/openclawImports.js';
import logger from '@/utils/logger.js';

/**
 * TelegramAdapter provides a grammY-powered implementation of the ChannelAdapter.
 */
export class TelegramAdapter implements ChannelAdapter {
  public readonly id = 'telegram';
  public readonly instanceId: string;
  private bot: Bot;
  private messageHandler: ((event: InboundMessageEvent) => Promise<void>) | null = null;
  private token: string;
  public fullPath?: string;

  constructor(private tenantId: string, private channelId: string, fullPath: string | undefined, channelData: any) {
    this.instanceId = channelId;
    this.fullPath = fullPath;
    this.token = channelData?.credentials?.token || '';
    if (!this.token) throw new Error('Missing Telegram token in channelData');
    this.bot = new Bot(this.token);
  }

  public async initialize(): Promise<void> {
    // grammY init
    await this.bot.init();

    // Setup message listener
    this.bot.on('message', async (ctx) => {
      if (this.messageHandler) {
        // Increment received stats
        try {
          const { channelService } = await import('@/services/ChannelService.js');
          await channelService.incrementChannelStat(this.tenantId, this.channelId, 'messagesReceived');
        } catch (e) {
          logger.warn('Failed to increment stats in TelegramAdapter', e);
        }

        await this.messageHandler({
          tenantId: this.tenantId,
          channelId: this.channelId,
          channelType: this.id,
          sender: ctx.from?.username || ctx.from?.id.toString() || 'unknown',
          content: ctx.message.text,
          timestamp: new Date(ctx.message.date * 1000),
          raw: ctx.message
        });
      }
    });
  }

  public async connect(): Promise<void> {
    // For long-polling or webhook.
    // In our multi-tenant server, we use webhooks.
    logger.info(`TelegramAdapter for ${this.channelId} initialized.`);
  }

  public async disconnect(): Promise<void> {
    await this.bot.stop();
  }

  public async shutdown(): Promise<void> {
    await this.disconnect();
  }

  public async sendMessage(target: string, text: string): Promise<void> {
    // Use OpenClaw's robust send logic via dist to avoid tsx source resolution issues
    const { sendMessageTelegram } = await getTelegramSend();
    await sendMessageTelegram(target, text, {
      token: this.token,
      api: this.bot.api as any,
      textMode: "markdown",
    });

    // Track stats
    try {
      const { channelService } = await import('@/services/ChannelService.js');
      await channelService.incrementChannelStat(this.tenantId, this.channelId, 'messagesSent');
    } catch (e) {
      logger.warn('Failed to increment stats in TelegramAdapter', e);
    }
  }

  public async sendCommon(message: any): Promise<void> {
    if (!message.content?.text) return;
    await this.sendMessage(message.to, message.content.text);
  }

  public onMessage(handler: (event: InboundMessageEvent) => Promise<void>): void {
    this.messageHandler = handler;
  }

  /**
   * Express middleware for handling Telegram Webhooks
   */
  public async handleWebhook(req: any, res: any): Promise<void> {
    if (!this.bot) {
      res.status(503).send('Service Unavailable');
      return;
    }

    // Uses grammY's native Express wrapper to process the raw update
    const callback = webhookCallback(this.bot, 'express');
    await callback(req, res);
  }
}
