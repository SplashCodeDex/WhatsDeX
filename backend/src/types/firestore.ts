import { Timestamp } from 'firebase-admin/firestore';

/**
 * Root 'tenants' collection document
 */
export interface TenantDocument {
  id: string;
  name: string;
  subdomain: string;
  plan: 'free' | 'premium' | 'enterprise';
  status: 'active' | 'suspended' | 'cancelled';
  ownerId: string; // Firebase Auth UID
  stripeCustomerId?: string;
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
  joinedAt: Timestamp | Date;
  lastLogin?: Timestamp | Date;
  metadata?: Record<string, any>;
}

/**
 * 'tenants/{tenantId}/bots' subcollection document
 */
export interface BotInstanceDocument {
  id: string;
  name: string;
  phoneNumber?: string;
  status: 'online' | 'offline' | 'connecting' | 'error';
  lastSeen?: Timestamp | Date;
  connectionMetadata: {
    browser: [string, string, string]; // e.g. ['WhatsDeX', 'Chrome', '1.0.0']
    platform: string;
  };
  stats: {
    messagesSent: number;
    messagesReceived: number;
    errorsCount: number;
  };
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
}
