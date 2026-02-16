import { type Bot } from "@/types/index.js";
import { type ChannelAdapter, type ChannelCapabilities, type ChannelId } from "../ChannelAdapter.js";

/**
 * Adapter for WhatsApp integration using existing WhatsDeX Baileys Bot.
 */
export class WhatsappAdapter implements ChannelAdapter {
    public readonly id: ChannelId = "whatsapp";
    public get instanceId(): string {
        // Return formatted JID of the bot (e.g. phone number)
        return this.bot.user?.id || "unknown";
    }
    public readonly capabilities: ChannelCapabilities = {
        chatTypes: ["direct", "group"],
        nativeCommands: true,
        polls: true,
        reactions: true,
        media: true,
        threads: false, // WhatsApp doesn't have threads in the same way Telegram does (yet)
    };

    private bot: Bot;

    constructor(bot: Bot) {
        this.bot = bot;
    }

    async handleWebhook(req: any, res: any): Promise<void> {
        // WhatsApp webhooks are handled by MultiTenantBotService -> webhookService
        // This is a no-op or could forward to them if we unify routes later.
        console.log("[WhatsappAdapter] handleWebhook called (no-op, handled by legacy service)");
    }

    async connect(): Promise<void> {
        // WhatsDeX manages connection lifecycle externally via MultiTenantBotService
        // So this is a no-op or a check
        if (this.bot.ws?.isOpen) {
            return;
        }
        // We can't initiate connection here easily as it's tied to AuthSystem
        console.warn("[WhatsappAdapter] connect() called but connection is managed by MultiTenantBotService");
    }

    async disconnect(): Promise<void> {
        // Similarly, explicit disconnect might interfere with MultiTenantBotService
        console.warn("[WhatsappAdapter] disconnect() called but connection is managed by MultiTenantBotService");
        // this.bot.end(undefined); // Potential risk
    }

    async sendMessage(to: string, content: string): Promise<void> {
        if (!this.bot.sendMessage) {
            throw new Error("Bot instance does not support sendMessage");
        }

        // Ensure JID is formatted correctly
        const jid = to.includes("@s.whatsapp.net") || to.includes("@g.us")
            ? to
            : `${to}@s.whatsapp.net`;

        try {
            await this.bot.sendMessage(jid, { text: content });
        } catch (error) {
            console.error(`[WhatsappAdapter] Failed to send message to ${to}:`, error);
            throw error;
        }
    }

    /**
     * Access the underlying Baileys Bot instance
     */
    get client(): Bot {
        return this.bot;
    }
}
