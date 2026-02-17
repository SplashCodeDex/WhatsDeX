/**
 * Omnichannel Frontend Types
 */

export type ChannelType = 'whatsapp' | 'telegram';

export type ChannelStatus =
    | 'connected'
    | 'connecting'
    | 'disconnected'
    | 'error'
    | 'qr_pending'
    | 'initializing';

export interface Channel {
    id: string;
    name: string;
    type: ChannelType;
    status: ChannelStatus;
    account: string | null;
    lastActiveAt?: string | Date;
}

export interface ActivityEvent {
    id: string;
    botId: string;
    channel: string;
    type: 'inbound' | 'outbound' | 'system' | 'skill';
    message: string;
    timestamp: string;
    metadata?: Record<string, unknown>;
}

export interface BotProgressUpdate {
    botId: string;
    step: string;
    status: 'pending' | 'in_progress' | 'complete' | 'error';
    timestamp: string;
}
