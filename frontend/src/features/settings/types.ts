import { z } from 'zod';

export const TenantSettingsSchema = z.object({
    ownerNumber: z.string().min(10).describe('Primary WhatsApp number for this tenant'),
    ownerName: z.string().optional(),
    organization: z.string().optional(),
    botDefaults: z.object({
        prefix: z.array(z.string()).default(['.', '!', '/']),
        mode: z.enum(['public', 'private', 'group-only']).default('public'),
        autoReconnect: z.boolean().default(true),
        cooldownMs: z.number().min(0).default(10000),
    }),
    features: z.object({
        aiEnabled: z.boolean().default(false),
        campaignsEnabled: z.boolean().default(false),
        analyticsEnabled: z.boolean().default(true),
        webhooksEnabled: z.boolean().default(false),
        maxBots: z.number().min(1).default(1),
    }),
    notifications: z.object({
        email: z.boolean().default(true),
        webhookUrl: z.string().url().optional(),
        notifyOnBotDisconnect: z.boolean().default(true),
        notifyOnErrors: z.boolean().default(true),
    }),
});

export type TenantSettings = z.infer<typeof TenantSettingsSchema>;
