/**
 * Bot Validation Schemas
 */

import { z } from 'zod';

/**
 * Create bot schema
 */
export const createBotSchema = z.object({
    name: z
        .string()
        .min(1, 'Bot name is required')
        .max(50, 'Bot name must be less than 50 characters')
        .regex(/^[a-zA-Z0-9\s\-_]+$/, 'Bot name can only contain letters, numbers, spaces, hyphens, and underscores'),
});

export type CreateBotInput = z.infer<typeof createBotSchema>;

/**
 * Update bot schema
 */
export const updateBotSchema = z.object({
    name: z
        .string()
        .min(1, 'Bot name is required')
        .max(50, 'Bot name must be less than 50 characters')
        .optional(),
    config: z
        .object({
            // Identity
            name: z.string().min(1).optional(),

            // Behavior
            prefix: z.array(z.string()).optional(),
            mode: z.enum(['public', 'private', 'group-only']).optional(),
            selfMode: z.boolean().optional(),
            alwaysOnline: z.boolean().optional(),
            antiCall: z.boolean().optional(),
            autoRead: z.boolean().optional(),
            autoMention: z.boolean().optional(),
            autoAiLabel: z.boolean().optional(),
            autoTypingCmd: z.boolean().optional(),

            // Automation
            autoReply: z.boolean().optional(),
            autoReplyMessage: z.string().optional(),
            welcomeMessage: z.string().optional(),

            // AI Configuration
            aiEnabled: z.boolean().optional(),
            aiPersonality: z.string().optional(),

            // Sticker Configuration
            stickerPackname: z.string().optional(),
            stickerAuthor: z.string().optional(),

            // Rate Limiting
            cooldownMs: z.number().min(0).optional(),
            maxCommandsPerMinute: z.number().min(1).optional(),
        })
        .optional(),
});

export type UpdateBotInput = z.infer<typeof updateBotSchema>;

/**
 * Send message schema
 */
export const sendMessageSchema = z.object({
    botId: z.string().min(1, 'Bot ID is required'),
    to: z
        .string()
        .min(1, 'Recipient is required')
        .regex(/^\d+@s\.whatsapp\.net$/, 'Invalid WhatsApp JID format'),
    content: z
        .string()
        .min(1, 'Message content is required')
        .max(4096, 'Message is too long'),
    type: z.enum(['text', 'image', 'video', 'audio', 'document']).default('text'),
});

export type SendMessageInput = z.infer<typeof sendMessageSchema>;
