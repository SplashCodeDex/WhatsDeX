'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSocket } from '@/hooks/useSocket';

export interface BotLog {
    botId: string;
    message: string;
    level: 'info' | 'warn' | 'error' | 'success';
    timestamp: string;
}

/**
 * useBotLogs
 *
 * Hook to subscribe to real-time logs for a specific bot or all bots.
 */
export function useBotLogs(botId?: string) {
    const { on } = useSocket();
    const [logs, setLogs] = useState<BotLog[]>([]);

    const handleLog = useCallback((log: BotLog) => {
        // Filter by botId if provided
        if (botId && log.botId !== botId) return;

        setLogs(prev => [log, ...prev].slice(0, 100)); // Keep last 100 logs
    }, [botId]);

    useEffect(() => {
        const cleanup = on('bot_log', handleLog);
        return cleanup;
    }, [on, handleLog]);

    const clearLogs = useCallback(() => setLogs([]), []);

    return {
        logs,
        clearLogs
    };
}
