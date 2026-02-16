import { Bot, webhookCallback, type ApiClientOptions } from "grammy";
import { type ChannelAdapter, type ChannelCapabilities, type ChannelId } from "../ChannelAdapter.js";

/**
 * Adapter for Telegram integration using grammY.
 * Wraps OpenClaw-style logic but adapted for WhatsDeX's multi-tenant architecture.
 */
export class TelegramAdapter implements ChannelAdapter {
    public readonly id: ChannelId = "telegram";
    public get instanceId(): string {
        return this.token;
    }
    public readonly capabilities: ChannelCapabilities = {
        chatTypes: ["direct", "group", "channel", "thread"],
        nativeCommands: true,
        polls: true,
        reactions: true,
        media: true,
        threads: true,
    };

    private bot: Bot | null = null;
    private token: string;

    constructor(token: string) {
        this.token = token;
    }

    async connect(): Promise<void> {
        if (this.bot) return;

        // Initialize grammY Bot
        // In a real OpenClaw integration, we might want to use OpenClaw's fetch/proxy logic here
        this.bot = new Bot(this.token);

        // Initialize bot info
        await this.bot.init();
        console.log(`[TelegramAdapter] Connected as @${this.bot.botInfo.username}`);
    }

    async disconnect(): Promise<void> {
        if (!this.bot) return;
        // grammY bots don't have a strict disconnect unless polling is active
        // If we use long-polling or webhooks, we'd stop them here.
        // For now, just clear the reference.
        this.bot = null;
    }

    async sendMessage(to: string, content: string): Promise<void> {
        if (!this.bot) {
            throw new Error("TelegramAdapter not connected");
        }

        // Basic implementation - OpenClaw has much more robust logic (chunking, formatting, retries)
        // We should port that over or import utilities from OpenClaw in the future.
        try {
            await this.bot.api.sendMessage(to, content, {
                parse_mode: "HTML", // Default to HTML as per OpenClaw
            });
        } catch (error) {
            // Basic error handling
            console.error(`[TelegramAdapter] Failed to send message to ${to}:`, error);
            throw error;
        }
    }

    /**
     * Handle incoming webhook request using grammY's built-in handler
     */
    async handleWebhook(req: any, res: any): Promise<void> {
        if (!this.bot) {
            throw new Error("TelegramAdapter not connected");
        }

        // grammY's webhookCallback returns a middleware function that handles (req, res)
        // We assume an Express-like request/response object here.
        await webhookCallback(this.bot, "express")(req, res);
    }

    /**
     * Access the underlying grammY Bot instance for advanced operations
     */
    get client(): Bot | null {
        return this.bot;
    }
}
