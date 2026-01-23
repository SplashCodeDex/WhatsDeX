import { Timestamp } from 'firebase-admin/firestore';
import { ModerationItem, Violation, Campaign, Webhook, Contact, Audience, MessageTemplate } from './contracts.js';

/**
 * Root 'tenants' collection document
 */
export interface TenantDocument {
  id: string;
  name: string;
  subdomain: string;
  plan: 'starter' | 'pro' | 'enterprise';
  planTier: 'starter' | 'pro' | 'enterprise';
  subscriptionStatus: 'trialing' | 'active' | 'past_due' | 'unpaid' | 'canceled' | 'incomplete' | 'incomplete_expired' | 'paused';
  status: 'active' | 'suspended' | 'cancelled';
  ownerId: string; // Firebase Auth UID
  stripeCustomerId?: string;
  trialEndsAt?: Timestamp | Date;
  createdAt: Timestamp | Date;
  updatedAt: Timestamp | Date;
  settings: {
    maxBots: number;
    aiEnabled: boolean;
    customPairingCode?: string;
    timezone: string;
  };
}

/**
 * 'tenants/{tenantId}/users' subcollection document
 */
export interface TenantUserDocument {
  id: string; // Firebase Auth UID
  email: string;
  displayName: string;
  role: 'owner' | 'admin' | 'viewer';
  planTier: 'starter' | 'pro' | 'enterprise';
  subscriptionStatus: 'trialing' | 'active' | 'past_due' | 'unpaid' | 'canceled' | 'incomplete' | 'incomplete_expired' | 'paused';
  trialEndsAt?: Timestamp | Date;
  joinedAt: Timestamp | Date;
  lastLogin?: Timestamp | Date;
  metadata?: Record<string, unknown>;
}

/**
 * 'tenants/{tenantId}/bots' subcollection document
 */
export interface BotInstanceDocument {
  id: string;
  name: string;
  phoneNumber?: string;
  userId?: string; // Legacy/Owner mapping
  status: 'connected' | 'disconnected' | 'connecting' | 'qr_pending' | 'error';
  lastSeenAt?: Timestamp | Date;
  connectionMetadata: {
    browser: [string, string, string]; // e.g. ['WhatsDeX', 'Chrome', '1.0.0']
    platform: string;
  };
  stats: {
    messagesSent: number;
    messagesReceived: number;
    contactsCount: number;
    lastMessageAt?: Timestamp | Date | null;
    errorsCount: number;
  };
  createdAt: Timestamp | Date;
  updatedAt: Timestamp | Date;
}

/**
 * 'tenants/{tenantId}/members' subcollection document (WhatsApp users)
 */
export interface BotMemberDocument {
  id: string; // JID
  username?: string;
  coin: number;
  level: number;
  winGame: number;
  autolevelup?: boolean;
  banned?: boolean;
  afk?: {
    reason: string | null;
    timestamp: number;
  } | null;
  lastClaim?: Record<string, number>;
  lastSentMsg?: Record<string, unknown>;
  recentCommands?: unknown[];
  premium: boolean;
  createdAt: Timestamp | Date;
  updatedAt: Timestamp | Date;
}

/**
 * 'tenants/{tenantId}/groups' subcollection document
 */
export interface BotGroupDocument {
  id: string; // Group JID
  name: string;
  isBanned: boolean;
  prefix?: string;
  welcomeMessage?: string;
  settings?: {
    welcome?: {
      enabled: boolean;
      message: string;
      leaveMessage: string;
    };
    [key: string]: unknown;
  };
  metadata?: Record<string, unknown>;
  createdAt: Timestamp | Date;
  updatedAt: Timestamp | Date;
}

/**
 * 'tenants/{tenantId}/subscriptions' subcollection document
 */
export interface SubscriptionDocument {
  id: string;
  stripeSubscriptionId: string;
  stripeCustomerId: string;
  stripePriceId: string;
  planTier: 'starter' | 'pro' | 'enterprise';
  status: 'trialing' | 'active' | 'past_due' | 'unpaid' | 'canceled' | 'incomplete' | 'incomplete_expired' | 'paused';
  currentPeriodStart: Timestamp | Date;
  currentPeriodEnd: Timestamp | Date;
  trialStart?: Timestamp | Date;
  trialEnd?: Timestamp | Date;
  cancelAtPeriodEnd: boolean;
  canceledAt?: Timestamp | Date;
  createdAt: Timestamp | Date;
  updatedAt: Timestamp | Date;
}

/**
 * Generic type for Firestore collections mapping
 */
export interface FirestoreSchema {
  tenants: TenantDocument;
  'tenants/{tenantId}/users': TenantUserDocument;
  'tenants/{tenantId}/bots': BotInstanceDocument;
  'tenants/{tenantId}/members': BotMemberDocument;
  'tenants/{tenantId}/groups': BotGroupDocument;
  'tenants/{tenantId}/subscriptions': SubscriptionDocument;
  'tenants/{tenantId}/moderation': ModerationItem;
  'tenants/{tenantId}/violations': Violation;
  'tenants/{tenantId}/campaigns': Campaign;
  'tenants/{tenantId}/webhooks': Webhook;
  'tenants/{tenantId}/contacts': Contact;
  'tenants/{tenantId}/audiences': Audience;
  'tenants/{tenantId}/templates': MessageTemplate;
  'tenants/{tenantId}/bots/{botId}/auth': { value: any };
}
