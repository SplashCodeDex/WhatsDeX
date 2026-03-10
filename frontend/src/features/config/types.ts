import { z } from 'zod';

/**
 * Tenant Settings Schema
 */
export const TenantSettingsSchema = z.object({
    name: z.string().min(2, "Company name must be at least 2 characters"),
    ownerNumber: z.string().optional(),
    ownerName: z.string().optional(),
    timezone: z.string().default('UTC'),
    features: z.object({
        aiEnabled: z.boolean().default(false),
        campaignsEnabled: z.boolean().default(true),
        omnichannelEnabled: z.boolean().default(true),
    }).default({
        aiEnabled: false,
        campaignsEnabled: true,
        omnichannelEnabled: true,
    }),
    limits: z.object({
        maxChannels: z.number().int().min(1).default(1),
        maxUsers: z.number().int().min(1).default(5),
    }).default({
        maxChannels: 1,
        maxUsers: 5,
    }),
    notifications: z.object({
        alertEmail: z.string().email().optional().or(z.literal('')),
    }).default({
        alertEmail: '',
    }),
});

export type TenantSettings = z.infer<typeof TenantSettingsSchema>;
