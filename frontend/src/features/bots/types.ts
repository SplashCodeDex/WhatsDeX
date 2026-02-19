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
    type?: 'whatsapp' | 'telegram' | 'discord' | 'slack' | 'signal';
    phoneNumber: string | null;
    identifier?: string;
    status: BotStatus;
    lastSeenAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
    config: BotConfig;
    stats: BotStats;
}

/**
 * Bot specific configuration (Behavioral settings)
 */
export interface BotConfig {
    // Identity
    name: string;
    phoneNumber?: string;
    type?: 'whatsapp' | 'telegram' | 'discord' | 'slack' | 'signal';

    // Behavior
    prefix: string[];
    mode: 'public' | 'private' | 'group-only';
    selfMode: boolean;
    alwaysOnline: boolean;
    antiCall: boolean;
    autoRead: boolean;
    autoMention: boolean;
    autoAiLabel: boolean;
    autoTypingCmd: boolean;

    // Automation
    autoReply: boolean;
    autoReplyMessage?: string;
    welcomeMessage?: string;

    // AI Configuration
    aiEnabled: boolean;
    aiPersonality?: string;

    // Sticker Configuration
    stickerPackname: string;
    stickerAuthor: string;

    // Rate Limiting
    cooldownMs: number;
    maxCommandsPerMinute: number;

    // Command Management
    disabledCommands: string[];
}

/**
 * Command metadata (used in UI registries)
 */
export interface Command {
    name: string;
    aliases: string[];
    category: string;
    description: string;
    usage: string;
    permissions: Record<string, any>;
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
    type?: 'whatsapp' | 'telegram' | 'discord' | 'slack' | 'signal';
    phoneNumber: string | null;
    identifier?: string;
    status: BotStatus;
    messageCount: number;
    lastActiveAt: Date | null;
}

/**
 * Create bot input
 */
// Exported from schemas.js

/**
 * Update bot input
 */
// Exported from schemas.js

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
