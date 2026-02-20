import { z } from 'zod';

/**
 * Standardized Omnichannel Message Schema
 * 
 * Unifies messages from all channels (WhatsApp, Telegram, etc.) 
 * and identifies which Agent (Brain) handled the interaction.
 */
export const OmnichannelMessageSchema = z.object({
    id: z.string(),
    channelId: z.string(),
    channelType: z.enum(['whatsapp', 'telegram', 'discord', 'system']),
    agentId: z.string().optional().nullable(),
    remoteJid: z.string(),
    fromMe: z.boolean(),
    type: z.enum(['text', 'image', 'video', 'audio', 'document', 'sticker', 'system']),
    content: z.string(),
    mediaUrl: z.string().url().optional(),
    status: z.enum(['pending', 'sent', 'delivered', 'read', 'failed']),
    timestamp: z.string(),
    createdAt: z.string(),
    updatedAt: z.string(),
    metadata: z.record(z.string(), z.any()).optional(),
});

export type OmnichannelMessage = z.infer<typeof OmnichannelMessageSchema>;

export type CampaignStatus = 'draft' | 'pending' | 'sending' | 'completed' | 'paused' | 'error' | 'cancelled';

export interface CampaignStats {
    total: number;
    sent: number;
    failed: number;
    pending: number;
}

export interface Campaign {
    id: string;
    tenantId: string;
    name: string;
    templateId: string;
    audience: {
        type: 'groups' | 'contacts' | 'audience';
        targetId: string;
    };
    distribution: {
        type: 'single' | 'pool';
        botId?: string;
    };
    antiBan: {
        aiSpinning: boolean;
        minDelay: number;
        maxDelay: number;
        batchSize: number;
        batchPauseMin: number;
        batchPauseMax: number;
        workingHoursEnabled: boolean;
        workingHoursStart: string;
        workingHoursEnd: string;
        timezone: string;
        typingSimulation: boolean;
        maxTypingDelay: number;
    };
    schedule: {
        type: 'immediate' | 'scheduled';
        scheduledAt?: string;
    };
    stats: CampaignStats;
    status: CampaignStatus;
    createdAt: string;
    updatedAt: string;
    metadata?: Record<string, any>;
}

export interface MessageTemplate {
    id: string;
    tenantId: string;
    name: string;
    content: string;
    category: 'marketing' | 'utility' | 'authentication';
    mediaType: 'text' | 'image' | 'video' | 'document';
    mediaUrl?: string;
    createdAt: string;
    updatedAt: string;
}
