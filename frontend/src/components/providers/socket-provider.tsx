'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { toast } from 'sonner';

import { useMastermindStore, MastermindEvent } from '@/stores/useMastermindStore';

interface SocketContextType {
    socket: Socket | null;
    isConnected: boolean;
}

const SocketContext = createContext<SocketContextType>({
    socket: null,
    isConnected: false,
});

export const useSocket = (): SocketContextType => useContext(SocketContext);

export function SocketProvider({ children }: { children: React.ReactNode }): React.JSX.Element {
    const [socket, setSocket] = useState<Socket | null>(null);
    const [isConnected, setIsConnected] = React.useState(false);
    const addEvent = useMastermindStore((state) => state.addEvent);

    useEffect(() => {
        // Build socket URL from config/environment
        const socketUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

        const socketInstance = io(socketUrl, {
            path: '/api/socket',
            withCredentials: true,
            transports: ['websocket'],
            autoConnect: true,
        });

        socketInstance.on('connect', () => {
            setSocket(socketInstance);
            setIsConnected(true);
        });

        socketInstance.on('disconnect', () => {
            setIsConnected(false);
        });

        socketInstance.on('connect_error', (error) => {
            console.error('[Socket] Connection error:', error);
            // Silent error to avoid toast spam during initial auth handshake
        });

        // --- Mastermind Event Handling ---
        socketInstance.on('mastermind_event', (event: MastermindEvent) => {
            addEvent(event);

            // Contextual toasts for important events
            if (event.type === 'reasoning:error') {
                toast.error(`Agent Error: ${event.error}`, {
                    description: `Agent ID: ${event.agentId}`
                });
            }
        });

        return () => {
            socketInstance.disconnect();
            setSocket(null);
        };
    }, [addEvent]);

    return (
        <SocketContext.Provider value={{ socket, isConnected }}>
            {children}
        </SocketContext.Provider>
    );
}
