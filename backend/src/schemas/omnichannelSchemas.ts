import { z } from 'zod';

/**
 * Zod schemas for Omnichannel API validation
 * Adheres to DeXMart 2026 Rule 1 (Zero-Trust Data Layer)
 */

export const getAgentIdentitySchema = z.object({
    params: z.object({
        id: z.string().min(1, 'Agent ID is required'),
    }),
});

export const usageQuerySchema = z.object({
    query: z.object({
        days: z.preprocess((val) => parseInt(val as string, 10), z.number().int().positive().default(30)),
    }),
});

export const sessionLogsParamsSchema = z.object({
    params: z.object({
        key: z.string().min(1, 'Session key is required'),
    }),
});

export const agentIdentityResponseSchema = z.object({
    agentId: z.string(),
    name: z.string(),
    avatar: z.string().optional(),
    emoji: z.string().optional(), // Kept for DB compatibility but will be filtered in UI
    linkedChannels: z.array(z.object({
        id: z.string(),
        name: z.string(),
        type: z.enum(['whatsapp', 'telegram', 'discord', 'slack', 'signal', 'imessage', 'custom', 'irc', 'googlechat']),
        status: z.enum(['connected', 'disconnected', 'pairing', 'error', 'connecting', 'qr_pending', 'initializing']),
        account: z.string().optional().nullable(),
    })).optional(),
});

export type AgentIdentityResponse = z.infer<typeof agentIdentityResponseSchema>;
