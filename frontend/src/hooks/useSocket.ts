'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import { io, Socket } from 'socket.io-client';

import { useAuth } from '@/features/auth';
import { logger } from '@/lib/logger';

interface SocketOptions {
    path?: string;
    autoConnect?: boolean;
    namespace?: string;
}

interface SocketResult {
    socket: Socket | null;
    isConnected: boolean;
    on: (event: string, callback: (data: unknown) => void) => () => void;
    emit: (event: string, data: unknown) => void;
}

type AuthUser = { token?: string };

/**
 * useSocket
 *
 * Base hook for real-time WebSocket communication.
 * Automatically handles connection, authentication, and cleanup.
 */
export function useSocket(options: SocketOptions = {}): SocketResult {
    const { user } = useAuth();
    const socketRef = useRef<Socket | null>(null);
    const [socket, setSocket] = useState<Socket | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const { path = '/api/socket', autoConnect = true } = options;

    useEffect(() => {
        if (!user || !autoConnect) {
            return () => {
                if (socketRef.current) {
                    socketRef.current.disconnect();
                    socketRef.current = null;
                    setSocket(null);
                    setIsConnected(false);
                }
            };
        }

        if (socketRef.current?.connected) return;

        logger.info(`[Socket] Connecting to ${path}...`);

        const rawBackendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';
        const backendUrl = rawBackendUrl.endsWith('/') ? rawBackendUrl.slice(0, -1) : rawBackendUrl;

        const newSocket = io(backendUrl, {
            path,
            withCredentials: true,
            transports: ['websocket'], // 2026: Bypass polling for direct CPU/Network efficiency
            // Pass token if available
            auth: {
                token: (user as AuthUser).token
            }
        });

        socketRef.current = newSocket;

        newSocket.on('connect', () => {
            logger.info(`[Socket] Connected: ${newSocket.id}`);
            setSocket(newSocket);
            setIsConnected(true);
        });

        newSocket.on('connect_error', (error) => {
            logger.error('[Socket] Connection error:', error);
            setIsConnected(false);
        });

        newSocket.on('disconnect', (reason) => {
            logger.warn('[Socket] Disconnected:', reason);
            setIsConnected(false);
        });

        return () => {
            logger.info('[Socket] Cleaning up...');
            newSocket.disconnect();
            socketRef.current = null;
            setSocket(null);
            setIsConnected(false);
        };
    }, [user, path, autoConnect]);

    /**
     * Subscribe to an event
     */
    const on = useCallback((event: string, callback: (data: unknown) => void): () => void => {
        const socket = socketRef.current;
        if (!socket) return () => { };

        socket.on(event, callback);
        return () => socket.off(event, callback);
    }, []);

    /**
     * Emit an event
     */
    const emit = useCallback((event: string, data: unknown): void => {
        if (!socketRef.current) {
            logger.warn(`[Socket] Cannot emit ${event}: Socket not connected`);
            return;
        }
        socketRef.current.emit(event, data);
    }, []);

    return {
        socket,
        isConnected,
        on,
        emit
    };
}
