/**
 * Bot Feature Types
 */

import type { Timestamp } from 'firebase/firestore';

/**
 * Bot connection status
 */
export type BotStatus = 'connected' | 'disconnected' | 'connecting' | 'qr_pending' | 'error';

/**
 * Bot document type (matches Firestore schema)
 */
export interface Bot {
    id: string;
    name: string;
    phoneNumber: string | null;
    status: BotStatus;
    lastSeenAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
    settings: BotSettings;
    stats: BotStats;
}

/**
 * Bot settings
 */
export interface BotSettings {
    autoReply: boolean;
    welcomeMessage: string | null;
    awayMessage: string | null;
    businessHours: BusinessHours | null;
}

/**
 * Business hours configuration
 */
export interface BusinessHours {
    enabled: boolean;
    timezone: string;
    schedule: {
        [day: string]: {
            isOpen: boolean;
            openTime: string;
            closeTime: string;
        };
    };
}

/**
 * Bot statistics
 */
export interface BotStats {
    messagesSent: number;
    messagesReceived: number;
    contactsCount: number;
    lastMessageAt: Date | null;
    errorsCount: number;
}

/**
 * Bot list item (summary for list views)
 */
export interface BotListItem {
    id: string;
    name: string;
    phoneNumber: string | null;
    status: BotStatus;
    messageCount: number;
    lastActiveAt: Date | null;
}

/**
 * Create bot input
 */
export interface CreateBotInput {
    name: string;
}

/**
 * Update bot input
 */
export interface UpdateBotInput {
    name?: string;
    settings?: Partial<BotSettings>;
}

/**
 * QR Code response
 */
export interface QRCodeResponse {
    qrCode: string;
    expiresAt: Date;
}

/**
 * Bot connection event
 */
export interface BotConnectionEvent {
    type: 'connecting' | 'connected' | 'disconnected' | 'qr' | 'error';
    botId: string;
    data?: unknown;
    timestamp: Date;
}
