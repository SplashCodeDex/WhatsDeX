'use client';

import { create } from 'zustand';
import { api } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/api/endpoints';
import type {
    Channel,
    ActivityEvent,
    BotProgressUpdate,
    ApiResponse,
    isApiSuccess
} from '@/types';

interface OmnichannelState {
    // Data
    channels: Channel[];
    activity: ActivityEvent[];
    isLoading: boolean;
    error: string | null;

    // Actions
    fetchChannels: () => Promise<void>;
    updateChannelStatus: (botId: string, status: Channel['status']) => void;
    addActivityEvent: (event: Omit<ActivityEvent, 'id'>) => void;
    handleProgressUpdate: (update: BotProgressUpdate) => void;
}

const MAX_ACTIVITY_LOGS = 100;

/**
 * Omnichannel Store
 *
 * Manages the state for all communication channels (WhatsApp, Telegram, etc.)
 * and the real-time activity feed.
 */
export const useOmnichannelStore = create<OmnichannelState>((set, get) => ({
    channels: [],
    activity: [],
    isLoading: false,
    error: null,

    fetchChannels: async () => {
        set({ isLoading: true, error: null });
        try {
            const response = await api.get<Channel[]>(API_ENDPOINTS.OMNICHANNEL.STATUS);

            if (response.success) {
                set({ channels: response.data, isLoading: false });
            } else {
                set({ error: response.error.message, isLoading: false });
            }
        } catch (err) {
            set({
                error: 'Failed to connect to the server',
                isLoading: false
            });
        }
    },

    updateChannelStatus: (botId, status) => {
        set((state) => ({
            channels: state.channels.map((c) =>
                c.id === botId ? { ...c, status } : c
            )
        }));
    },

    addActivityEvent: (event) => {
        const newEvent: ActivityEvent = {
            ...event,
            id: `event-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        };

        set((state) => ({
            activity: [newEvent, ...state.activity].slice(0, MAX_ACTIVITY_LOGS)
        }));
    },

    handleProgressUpdate: (update) => {
        const { botId, step, status: progressStatus } = update;

        // Map progress status to channel status
        let channelStatus: Channel['status'] = 'connecting';

        if (progressStatus === 'complete') channelStatus = 'connected';
        else if (progressStatus === 'error') channelStatus = 'error';

        set((state) => ({
            channels: state.channels.map((c) =>
                c.id === botId ? {
                    ...c,
                    status: channelStatus,
                    lastProgress: { step, status: progressStatus }
                } : c
            )
        }));

        // Also log progress as a system activity event
        get().addActivityEvent({
            botId,
            channel: 'system',
            type: 'system',
            message: `${step}: ${status}`,
            timestamp: new Date().toISOString()
        });
    }
}));
