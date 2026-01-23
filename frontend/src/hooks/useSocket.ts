'use client';

import { useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '@/features/auth';
import { logger } from '@/lib/logger';

/**
 * useSocket
 *
 * Base hook for real-time WebSocket communication.
 * Automatically handles connection, authentication, and cleanup.
 */
export function useSocket(options: {
    path?: string;
    autoConnect?: boolean;
    namespace?: string;
} = {}) {
    const { user } = useAuth();
    const socketRef = useRef<Socket | null>(null);
    const { path = '/api/socket', autoConnect = true } = options;

    useEffect(() => {
        if (!user || !autoConnect) {
            if (socketRef.current) {
                socketRef.current.disconnect();
                socketRef.current = null;
            }
            return;
        }

        if (socketRef.current?.connected) return;

        logger.info(`[Socket] Connecting to ${path}...`);

        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || '';

        socketRef.current = io(backendUrl, {
            path,
            withCredentials: true,
            transports: ['websocket'], // 2026: Bypass polling for direct CPU/Network efficiency
            // Pass token if available
            auth: {
                token: (user as any).token
            }
        });

        socketRef.current.on('connect', () => {
            logger.info(`[Socket] Connected: ${socketRef.current?.id}`);
        });

        socketRef.current.on('connect_error', (error) => {
            logger.error('[Socket] Connection error:', error);
        });

        socketRef.current.on('disconnect', (reason) => {
            logger.warn('[Socket] Disconnected:', reason);
        });

        return () => {
            if (socketRef.current) {
                logger.info('[Socket] Cleaning up...');
                socketRef.current.disconnect();
                socketRef.current = null;
            }
        };
    }, [user, path, autoConnect]);

    /**
     * Subscribe to an event
     */
    const on = useCallback((event: string, callback: (data: any) => void) => {
        const socket = socketRef.current;
        if (!socket) return () => { };

        socket.on(event, callback);
        return () => socket.off(event, callback);
    }, []);

    /**
     * Emit an event
     */
    const emit = useCallback((event: string, data: any) => {
        if (!socketRef.current) {
            logger.warn(`[Socket] Cannot emit ${event}: Socket not connected`);
            return;
        }
        socketRef.current.emit(event, data);
    }, []);

    return {
        socket: socketRef.current,
        isConnected: socketRef.current?.connected ?? false,
        on,
        emit
    };
}
