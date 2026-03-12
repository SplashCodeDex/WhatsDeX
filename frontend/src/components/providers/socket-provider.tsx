'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useMastermindStore, MastermindEvent } from '@/stores/useMastermindStore';
import { toast } from 'sonner';

interface SocketContextType {
    socket: Socket | null;
    isConnected: boolean;
}

const SocketContext = createContext<SocketContextType>({
    socket: null,
    isConnected: false,
});

export const useSocket = () => useContext(SocketContext);

export function SocketProvider({ children }: { children: React.ReactNode }) {
    const [socket, setSocket] = useState<Socket | null>(null);
    const [isConnected, setIsConnected] = useState(false);
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
            console.log('[Socket] Connected to Mastermind Gateway');
            setIsConnected(true);
        });

        socketInstance.on('disconnect', () => {
            console.log('[Socket] Disconnected');
            setIsConnected(false);
        });

        socketInstance.on('connect_error', (error) => {
            console.error('[Socket] Connection error:', error);
            // Silent error to avoid toast spam during initial auth handshake
        });

        // --- Mastermind Event Handling ---
        socketInstance.on('mastermind_event', (event: MastermindEvent) => {
            console.log('[Socket] Mastermind Event:', event.type, event.agentId);
            addEvent(event);
            
            // Contextual toasts for important events
            if (event.type === 'reasoning:error') {
                toast.error(`Agent Error: ${event.error}`, {
                    description: `Agent ID: ${event.agentId}`
                });
            }
        });

        setSocket(socketInstance);

        return () => {
            socketInstance.disconnect();
        };
    }, [addEvent]);

    return (
        <SocketContext.Provider value={{ socket, isConnected }}>
            {children}
        </SocketContext.Provider>
    );
}
