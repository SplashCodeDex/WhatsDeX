import { z } from 'zod';

export const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(3001),
  DATABASE_URL: z.string().url().startsWith('postgresql://', { message: 'Must be a PostgreSQL URL' }),
  
  // Bot Config
  BOT_NAME: z.string().default('whatsdex'),
  BOT_PREFIX: z.string().default('^[°•π÷×¶∆£¢€¥®™+✓_=|/~!?@#%^&.©^]'),
  BOT_PHONE_NUMBER: z.string().optional(),
  GROUP_JID: z.string().optional(),
  NEWSLETTER_JID: z.string().default('120363416372653441@newsletter'),
  
  // Owner Config
  OWNER_NAME: z.string().default('Your Name'),
  OWNER_NUMBER: z.string().default('1234567890'),
  
  // Auth Adapter
  AUTH_ADAPTER: z.enum(['default', 'mysql', 'mongodb', 'firebase']).default('default'),
  
  // Firebase
  FIREBASE_TABLE_NAME: z.string().default('whatsdex'),
  FIREBASE_SESSION: z.string().default('state'),
});

export type EnvConfig = z.infer<typeof envSchema>;
