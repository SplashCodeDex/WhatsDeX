'use client';

import { useEffect } from 'react';
import { useSocket } from '@/hooks/useSocket';
import { useOmnichannelStore } from '@/stores/useOmnichannelStore';
import { logger } from '@/lib/logger';

/**
 * OmnichannelSocketManager
 *
 * A headless component that handles WebSocket subscriptions for the Omnichannel Hub
 * and keeps the Zustand store in sync with the backend.
 */
export function OmnichannelSocketManager() {
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
            handleProgressUpdate(data);
        });

        // 3. Subscribe to Activity Events (Messages, Skills, etc.)
        const cleanupActivity = on('activity_event', (data) => {
            logger.info('[Omnichannel] Activity Event:', data);
            addActivityEvent(data);
        });

        // 4. Subscribe to Connection Status Updates
        const cleanupStatus = on('bot_status_update', (data: { botId: string, status: any }) => {
            logger.info('[Omnichannel] Status Update:', data);
            updateChannelStatus(data.botId, data.status);
        });

        // 5. Subscribe to Logs
        const cleanupLogs = on('bot_log', (data) => {
            addActivityEvent({
                botId: data.botId,
                channel: 'system',
                type: 'system',
                message: data.message,
                timestamp: data.timestamp || new Date().toISOString()
            });
        });

        return () => {
            cleanupProgress();
            cleanupActivity();
            cleanupStatus();
            cleanupLogs();
        };
    }, [on, fetchChannels, handleProgressUpdate, addActivityEvent, updateChannelStatus]);

    return null; // Headless component
}
