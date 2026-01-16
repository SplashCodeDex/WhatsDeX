import { z } from 'zod';

export const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(3001),
  // DATABASE_URL removed as we use Firestore exclusively

  // Bot Config
  BOT_NAME: z.string().default('whatsdex'),
  BOT_PREFIX: z.string().default('^[°•π÷×¶∆£¢€¥®™+✓_=|/~!?@#%^&.©^]'),
  BOT_PHONE_NUMBER: z.string().optional(),
  GROUP_JID: z.string().optional(),
  NEWSLETTER_JID: z.string().default('120363416372653441@newsletter'),
  SESSION_ID: z.string().default('default'),
  TENANT_ID: z.string().default('system'),

  // NOTE: OWNER_NAME and OWNER_NUMBER are now per-tenant settings in Firestore
  // See: TenantConfigService.getTenantSettings()

  // Auth Adapter
  AUTH_ADAPTER: z.enum(['default', 'mysql', 'mongodb', 'firebase']).default('default'),

  // Firebase
  FIREBASE_TABLE_NAME: z.string().default('whatsdex'),
  FIREBASE_SESSION: z.string().default('state'),
  FIREBASE_SERVICE_ACCOUNT_PATH: z.string().optional(),
  FIREBASE_WEB_API_KEY: z.string().optional(), // Required for Firebase Auth REST API login

  // App URL & Frontend
  NEXT_PUBLIC_APP_URL: z.string().url().default('http://localhost:3000'),
  JWT_SECRET: z.string().default('secret'),

  // Rate Limiting
  RATE_LIMIT_MAX: z.coerce.number().default(100),

  // Stripe
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),

  // System
  USE_SERVER: z.coerce.boolean().default(true),
  BOT_COOLDOWN_MS: z.coerce.number().default(10000),
  TIME_ZONE: z.string().default('Africa/Accra'),
  REQUIRE_BOT_GROUP_MEMBERSHIP: z.coerce.boolean().default(false),
  REQUIRE_GROUP_SEWA: z.coerce.boolean().default(false),
  UNAVAILABLE_AT_NIGHT: z.coerce.boolean().default(false),
  PRIVATE_PREMIUM_ONLY: z.coerce.boolean().default(false),
  RESTRICT_COMMANDS: z.coerce.boolean().default(false),
  USE_COIN: z.coerce.boolean().default(true),

  // AI & Gemini
  GOOGLE_GEMINI_API_KEY: z.string().optional(),
  META_AI_KEY: z.string().optional(),
  AI_SUMMARIZE_THRESHOLD: z.coerce.number().default(16),
  AI_MESSAGES_TO_SUMMARIZE: z.coerce.number().default(10),
  AI_HISTORY_PRUNE_LENGTH: z.coerce.number().default(6),
  GROUP_LINK: z.string().url().optional(),
});

export type EnvConfig = z.infer<typeof envSchema>;
