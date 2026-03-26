'use client';

import { useEffect } from 'react';

import { useSocket } from '@/hooks/useSocket';
import type { Channel } from '@/types';
import { logger } from '@/lib/logger';
import { useOmnichannelStore } from '@/stores/useOmnichannelStore';

/**
 * OmnichannelSocketManager
 *
 * A headless component that handles WebSocket subscriptions for the Omnichannel Hub
 * and keeps the Zustand store in sync with the backend.
 */
export function OmnichannelSocketManager(): null {
    const { on } = useSocket();
    const {
        fetchChannels,
        handleProgressUpdate,
        addActivityEvent,
        updateChannelStatus
    } = useOmnichannelStore();

    useEffect(() => {
        // 1. Initial Data Fetch
        fetchChannels();

        // 2. Subscribe to Bot Progress Updates (Connecting, Initializing, etc.)
        const cleanupProgress = on('bot_progress_update', (data) => {
            logger.info('[Omnichannel] Progress Update:', data);
            handleProgressUpdate(data as Parameters<typeof handleProgressUpdate>[0]);
        });

        // 3. Subscribe to Activity Events (Messages, Skills, etc.)
        const cleanupActivity = on('activity_event', (data) => {
            logger.info('[Omnichannel] Activity Event:', data);
            addActivityEvent(data as Parameters<typeof addActivityEvent>[0]);
        });

        // 4. Subscribe to Connection Status Updates
        const cleanupChannelStatus = on('channel_status_update', (data) => {
            logger.info('[Omnichannel] Channel Status Update:', data);
            const update = data as { channelId: string; status: Channel['status'] };
            updateChannelStatus(update.channelId, update.status);
        });

        // 5. Subscribe to Logs
        const cleanupLogs = on('bot_log', (data) => {
            const log = data as { botId?: string; message?: string; timestamp?: string };
            addActivityEvent({
                botId: log.botId ?? 'system',
                channel: 'system',
                type: 'system',
                message: log.message ?? '',
                timestamp: log.timestamp || new Date().toISOString()
            });
        });

        return () => {
            cleanupProgress();
            cleanupActivity();
            cleanupChannelStatus();
            cleanupLogs();
        };
    }, [on, fetchChannels, handleProgressUpdate, addActivityEvent, updateChannelStatus]);

    return null; // Headless component
}
