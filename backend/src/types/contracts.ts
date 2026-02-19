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
  name: z.string().min(2, { message: "Name must be at least 2 characters" }),
  subdomain: z.preprocess((val) => val ?? '', z.string().toLowerCase().optional()),
  plan: z.preprocess((val) => {
    if (typeof val === 'string' && ['starter', 'pro', 'enterprise'].includes(val.toLowerCase())) return val.toLowerCase();
    return undefined; // Triggers default('starter')
  }, z.enum(['starter', 'pro', 'enterprise']).default('starter')),
  planTier: z.enum(['starter', 'pro', 'enterprise']).default('starter'),
  subscriptionStatus: z.enum(['trialing', 'active', 'past_due', 'unpaid', 'canceled', 'incomplete', 'incomplete_expired', 'paused']).default('trialing'),
  status: z.preprocess((val) => {
    if (typeof val === 'string' && ['active', 'suspended', 'cancelled'].includes(val)) return val;
    return undefined; // Triggers default('active')
  }, z.enum(['active', 'suspended', 'cancelled']).default('active')),
  ownerId: z.preprocess((val) => val ?? '', z.string().optional()),
  stripeCustomerId: z.string().nullish(),
  trialEndsAt: TimestampSchema.nullish(),
  createdAt: TimestampSchema.nullish(),
  updatedAt: TimestampSchema.nullish(),
  settings: z.preprocess((val) => val ?? {}, z.object({
    maxBots: z.preprocess((val) => val ?? undefined, z.number().int().min(1).default(1)),
    aiEnabled: z.preprocess((val) => val ?? undefined, z.boolean().default(false)),
    customPairingCode: z.string().nullish(),
    timezone: z.string().default('UTC').nullish()
  }).optional())
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
  planTier: z.enum(['starter', 'pro', 'enterprise']).default('starter'),
  subscriptionStatus: z.enum(['trialing', 'active', 'past_due', 'unpaid', 'canceled', 'incomplete', 'incomplete_expired', 'paused']).default('trialing'),
  trialEndsAt: TimestampSchema.nullish(),
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
  status: z.enum(['connected', 'disconnected', 'connecting', 'qr_pending', 'error']),
  lastSeenAt: TimestampSchema.optional(),
  connectionMetadata: z.object({
    browser: z.tuple([z.string(), z.string(), z.string()]),
    platform: z.string()
  }),
  stats: z.object({
    messagesSent: z.number().default(0),
    messagesReceived: z.number().default(0),
    contactsCount: z.number().default(0),
    lastMessageAt: TimestampSchema.nullish(),
    errorsCount: z.number().default(0)
  }),
  config: z.any().optional(),
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

/**
 * Subscription Schema ('tenants/{tenantId}/subscriptions' subcollection)
 */
export const SubscriptionSchema = z.object({
  id: z.string(),
  stripeSubscriptionId: z.string(),
  stripeCustomerId: z.string(),
  stripePriceId: z.string(),
  planTier: z.enum(['starter', 'pro', 'enterprise']),
  status: z.enum(['trialing', 'active', 'past_due', 'unpaid', 'canceled', 'incomplete', 'incomplete_expired', 'paused']),
  currentPeriodStart: TimestampSchema,
  currentPeriodEnd: TimestampSchema,
  trialStart: TimestampSchema.nullish(),
  trialEnd: TimestampSchema.nullish(),
  cancelAtPeriodEnd: z.boolean().default(false),
  canceledAt: TimestampSchema.nullish(),
  createdAt: TimestampSchema,
  updatedAt: TimestampSchema
}).readonly();

export type Subscription = z.infer<typeof SubscriptionSchema>;

/**
 * Campaign Status Enum
 */
export const CampaignStatusSchema = z.enum(['draft', 'pending', 'sending', 'completed', 'paused', 'error', 'cancelled']);
export type CampaignStatus = z.infer<typeof CampaignStatusSchema>;

/**
 * Campaign Schema ('tenants/{tenantId}/campaigns' subcollection)
 */
export const CampaignSchema = z.object({
  id: z.string(),
  tenantId: z.string(),
  name: z.string().min(1),
  templateId: z.string().min(1, "Template ID is required"),
  audience: z.object({
    type: z.enum(['groups', 'contacts', 'audience']),
    targetId: z.string(), // ID of the Audience or Group
  }),
  distribution: z.object({
    type: z.enum(['single', 'pool']),
    botId: z.string().optional(), // Used if type is 'single'
  }),
  antiBan: z.object({
    uuid: z.string().optional(), // Strategy identifier
    aiSpinning: z.boolean().default(false),
    minDelay: z.number().default(10), // seconds
    maxDelay: z.number().default(30), // seconds
    // Human Path Enhancements
    batchSize: z.number().default(0), // 0 means no batch pauses
    batchPauseMin: z.number().default(5), // minutes
    batchPauseMax: z.number().default(15), // minutes
    workingHoursEnabled: z.boolean().default(false),
    workingHoursStart: z.string().default('08:00'),
    workingHoursEnd: z.string().default('20:00'),
    timezone: z.string().default('UTC'), // Timezone for working hours
    typingSimulation: z.boolean().default(false), // Show typing status before sending
    maxTypingDelay: z.number().default(5), // max seconds to "type"
  }),
  schedule: z.object({
    type: z.enum(['immediate', 'scheduled']),
    scheduledAt: TimestampSchema.optional(),
  }),
  stats: z.object({
    total: z.number().default(0),
    sent: z.number().default(0),
    failed: z.number().default(0),
    pending: z.number().default(0)
  }),
  status: CampaignStatusSchema.default('draft'),
  createdAt: TimestampSchema,
  updatedAt: TimestampSchema,
  metadata: z.record(z.string(), z.any()).optional()
}).readonly();

export type Campaign = z.infer<typeof CampaignSchema>;

/**
 * Webhook Event Enum
 */
export const WebhookEventSchema = z.enum([
  'message.received',
  'message.sent',
  'bot.connected',
  'bot.disconnected',
  'bot.error',
  'campaign.completed'
]);
export type WebhookEvent = z.infer<typeof WebhookEventSchema>;

/**
 * Webhook Schema ('tenants/{tenantId}/webhooks' subcollection)
 */
export const WebhookSchema = z.object({
  id: z.string(),
  url: z.string().url({ message: "Invalid webhook URL format" }),
  events: z.array(WebhookEventSchema).min(1, { message: "At least one event must be selected" }),
  secret: z.string().min(16, { message: "Secret must be at least 16 characters for security" }), // For HMAC signing
  isActive: z.boolean().default(true),
  name: z.string().optional(),
  createdAt: TimestampSchema,
  updatedAt: TimestampSchema,
  metadata: z.record(z.string(), z.any()).optional()
}).readonly();

export type Webhook = z.infer<typeof WebhookSchema>;

/**
 * Learning Data Schema ('tenants/{tenantId}/learning/{userId}' subcollection)
 * Stores facts and preferences learned about a specific user
 */
export const LearningSchema = z.object({
  userId: z.string(), // JID
  facts: z.array(z.object({
    id: z.string(),
    content: z.string(),
    category: z.string().optional(),
    confidence: z.number(),
    sourceMessageId: z.string().optional(),
    extractedAt: TimestampSchema,
    updatedAt: TimestampSchema
  })).default([]),
  preferences: z.record(z.string(), z.any()).default({}),
  lastInteraction: TimestampSchema,
  metadata: z.record(z.string(), z.any()).optional()
}).readonly();

export type LearningData = z.infer<typeof LearningSchema>;

/**
 * Contact Schema ('tenants/{tenantId}/contacts' subcollection)
 */
export const ContactSchema = z.object({
  id: z.string(),
  tenantId: z.string(), // De-normalized for easier querying/validation if needed
  name: z.string(),
  phone: z.string().min(1, "Phone number is required"),
  email: z.string().email().optional().or(z.literal('')),
  attributes: z.record(z.string(), z.any()).optional(),
  tags: z.array(z.string()).default([]),
  status: z.enum(['active', 'inactive', 'archived']).default('active'),
  createdAt: TimestampSchema,
  updatedAt: TimestampSchema
}).readonly();

export type Contact = z.infer<typeof ContactSchema>;

/**
 * Audience Schema ('tenants/{tenantId}/audiences' subcollection)
 */
export const AudienceSchema = z.object({
  id: z.string(),
  tenantId: z.string(),
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  filters: z.record(z.string(), z.any()).default({}), // e.g. { tags: ['vip'] }
  count: z.number().default(0), // Cached count of matching contacts
  createdAt: TimestampSchema,
  updatedAt: TimestampSchema
}).readonly();

export type Audience = z.infer<typeof AudienceSchema>;

/**
 * Template Schema ('tenants/{tenantId}/templates' subcollection)
 */
export const TemplateSchema = z.object({
  id: z.string(),
  tenantId: z.string(),
  name: z.string().min(1, "Template name is required"),
  content: z.string().min(1, "Template content is required"), // Supports {{variable}}
  category: z.enum(['marketing', 'utility', 'authentication']).default('marketing'),
  mediaType: z.enum(['text', 'image', 'video', 'document']).default('text'),
  mediaUrl: z.string().url().optional().or(z.literal('')),
  createdAt: TimestampSchema,
  updatedAt: TimestampSchema
}).readonly();

export type MessageTemplate = z.infer<typeof TemplateSchema>;

/**
 * Baileys Auth State Schema ('tenants/{tenantId}/bots/{botId}/auth' subcollection)
 * Stores session credentials and keys
 */
export const AuthSchema = z.object({
  value: z.any()
});

export type AuthData = z.infer<typeof AuthSchema>;

/**
 * Command Usage Schema ('tenants/{tenantId}/command_usage' subcollection)
 */
export const CommandUsageSchema = z.object({
  id: z.string(),
  command: z.string(),
  userId: z.string(),
  success: z.boolean(),
  executionTime: z.number().nullish(),
  category: z.string().optional(),
  error: z.string().optional(),
  usedAt: TimestampSchema,
  metadata: z.record(z.string(), z.any()).optional()
}).readonly();

export type CommandUsage = z.infer<typeof CommandUsageSchema>;

/**
 * Analytics Schema ('tenants/{tenantId}/analytics/{date}' subcollection)
 * Tracks daily message statistics
 */
export const AnalyticsSchema = z.object({
  date: z.string(), // ISO date string YYYY-MM-DD
  sent: z.number().default(0),
  received: z.number().default(0),
  errors: z.number().default(0),
  totalCommands: z.number().default(0),
  aiRequests: z.number().default(0),
  updatedAt: TimestampSchema
}).readonly();

export type AnalyticsData = z.infer<typeof AnalyticsSchema>;
