import { z } from 'zod';

/**
 * Result Type for Functional Error Handling (2026 Standard)
 */
export type Result<T, E = Error> =
  | { readonly success: true; readonly data: T }
  | { readonly success: false; readonly error: E };

/**
 * Common Parsers
 */
export const TimestampSchema = z.union([
  z.date(),
  z.object({
    _seconds: z.number(),
    _nanoseconds: z.number()
  }).transform(val => new Date(val._seconds * 1000))
]);

/**
 * Tenant Schema (Root 'tenants' collection)
 */
export const TenantSchema = z.object({
  id: z.string(),
  name: z.string().min(2),
  subdomain: z.string().toLowerCase(),
  plan: z.enum(['free', 'premium', 'enterprise']),
  status: z.enum(['active', 'suspended', 'cancelled']),
  ownerId: z.string(),
  stripeCustomerId: z.string().optional(),
  createdAt: TimestampSchema,
  updatedAt: TimestampSchema,
  settings: z.object({
    maxBots: z.number().int().min(1),
    aiEnabled: z.boolean(),
    customPairingCode: z.string().optional(),
    timezone: z.string().default('UTC')
  })
}).readonly();

export type Tenant = z.infer<typeof TenantSchema>;

/**
 * User Schema ('tenants/{tenantId}/users' subcollection)
 */
export const TenantUserSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  displayName: z.string(),
  role: z.enum(['owner', 'admin', 'viewer']),
  joinedAt: TimestampSchema,
  lastLogin: TimestampSchema.optional(),
  metadata: z.record(z.string(), z.any()).optional()
}).readonly();

export type TenantUser = z.infer<typeof TenantUserSchema>;

/**
 * Bot Instance Schema ('tenants/{tenantId}/bots' subcollection)
 */
export const BotInstanceSchema = z.object({
  id: z.string(),
  name: z.string(),
  phoneNumber: z.string().optional(),
  userId: z.string().optional(),
  status: z.enum(['online', 'offline', 'connecting', 'error']),
  lastSeen: TimestampSchema.optional(),
  connectionMetadata: z.object({
    browser: z.tuple([z.string(), z.string(), z.string()]),
    platform: z.string()
  }),
  stats: z.object({
    messagesSent: z.number().default(0),
    messagesReceived: z.number().default(0),
    errorsCount: z.number().default(0)
  }),
  createdAt: TimestampSchema,
  updatedAt: TimestampSchema
}).readonly();

export type BotInstance = z.infer<typeof BotInstanceSchema>;

/**
 * Moderation Item Schema
 */
export const ModerationItemSchema = z.object({
  id: z.string(),
  tenantId: z.string(),
  contentType: z.enum(['text', 'image', 'video', 'audio']),
  content: z.string(), // URL or text
  status: z.enum(['pending', 'approved', 'rejected', 'flagged']),
  priority: z.enum(['low', 'medium', 'high', 'critical']),
  reason: z.string().optional(),
  metadata: z.record(z.string(), z.any()).optional(),
  createdAt: TimestampSchema,
  updatedAt: TimestampSchema,
  reviewedBy: z.string().optional(),
  reviewedAt: TimestampSchema.optional()
}).readonly();

export type ModerationItem = z.infer<typeof ModerationItemSchema>;

/**
 * User Violation Schema
 */
export const ViolationSchema = z.object({
  id: z.string(),
  userId: z.string(),
  tenantId: z.string(),
  type: z.string(),
  severity: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
  description: z.string(),
  timestamp: TimestampSchema,
  metadata: z.record(z.string(), z.any()).optional()
}).readonly();

export type Violation = z.infer<typeof ViolationSchema>;

/**
 * Command Definition Schema
 */
export const CommandPermissionsSchema = z.object({
  admin: z.boolean().optional(),
  botAdmin: z.boolean().optional(),
  owner: z.boolean().optional(),
  group: z.boolean().optional(),
  private: z.boolean().optional(),
  premium: z.boolean().optional(),
  coin: z.number().optional()
}).readonly();

export const CommandSchema = z.object({
  name: z.string(),
  aliases: z.array(z.string()).optional(),
  category: z.string(),
  description: z.string().optional(),
  usage: z.string().optional(),
  permissions: CommandPermissionsSchema.optional(),
}).readonly();

export type CommandDefinition = z.infer<typeof CommandSchema>;

/**
 * Bot Member Schema ('tenants/{tenantId}/members' subcollection)
 */
export const BotMemberSchema = z.object({
  id: z.string(),
  username: z.string().optional(),
  coin: z.number().default(0),
  level: z.number().default(0),
  xp: z.number().default(0),
  winGame: z.number().default(0),
  autolevelup: z.boolean().default(true),
  banned: z.boolean().default(false),
  afk: z.object({
    reason: z.string().nullable(),
    timestamp: z.number()
  }).nullable().optional(),
  lastClaim: z.record(z.string(), z.number()).optional(),
  lastSentMsg: z.record(z.string(), z.number()).optional(),
  premium: z.boolean().default(false),
  createdAt: TimestampSchema,
  updatedAt: TimestampSchema
}).readonly();

export type BotMember = z.infer<typeof BotMemberSchema>;

/**
 * Group Data Schema ('tenants/{tenantId}/groups' subcollection)
 */
export const GroupSchema = z.object({
  id: z.string(), // JID
  subject: z.string(),
  owner: z.string().nullable().optional(),
  creation: TimestampSchema.optional(),
  desc: z.string().optional(),
  participants: z.array(z.string()),
  admins: z.array(z.string()),
  settings: z.object({
    announcement: z.boolean().default(false),
    locked: z.boolean().default(false),
    welcome: z.object({
      enabled: z.boolean().default(false),
      message: z.string().optional(),
      leaveMessage: z.string().optional()
    }).optional()
  }),
  metadata: z.record(z.string(), z.any()).optional(),
  updatedAt: TimestampSchema,
  syncedAt: TimestampSchema
}).readonly();

export type GroupData = z.infer<typeof GroupSchema>;

/**
 * Bot Group Schema ('tenants/{tenantId}/groups' subcollection) -- LEGACY?
 * Merging with GroupData concept. Keeping consistent naming.
 */
export const BotGroupSchema = z.object({
  id: z.string(), // Group JID
  name: z.string(),
  isBanned: z.boolean().default(false),
  prefix: z.string().optional(),
  welcomeMessage: z.string().optional(),
  metadata: z.record(z.string(), z.any()).optional(),
  createdAt: TimestampSchema,
  updatedAt: TimestampSchema
}).readonly();

export type BotGroup = z.infer<typeof BotGroupSchema>;
