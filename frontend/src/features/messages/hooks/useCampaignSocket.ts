'use client';

import { useEffect, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/features/auth/store';
import { Campaign } from '@/features/messages/types';
import { logger } from '@/lib/logger';

/**
 * Hook to manage campaign WebSocket connection and real-time updates
 */
export function useCampaignSocket() {
    const queryClient = useQueryClient();
    const { user } = useAuthStore();

    const handleUpdate = useCallback((data: { campaignId: string, stats: any }) => {
        // Update campaigns list in cache
        queryClient.setQueryData(['campaigns'], (oldData: Campaign[] | undefined) => {
            if (!oldData) return oldData;
            return oldData.map(c =>
                c.id === data.campaignId
                    ? { ...c, stats: { ...c.stats, ...data.stats }, status: data.stats.status || c.status }
                    : c
            );
        });

        // Also update individual campaign cache if it exists
        queryClient.setQueryData(['campaign', data.campaignId], (oldData: Campaign | undefined) => {
            if (!oldData) return oldData;
            return { ...oldData, stats: { ...oldData.stats, ...data.stats }, status: data.stats.status || oldData.status };
        });
    }, [queryClient]);

    useEffect(() => {
        if (!user?.tenantId) return;

        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';

        const socket: Socket = io(backendUrl, {
            path: '/api/campaigns/socket',
            // auth: { token }, // Token is handled via cookies
            transports: ['websocket'],
            withCredentials: true
        });

        socket.on('connect', () => {
            logger.info('Campaign socket connected');
        });

        socket.on('campaign_update', (data) => {
            handleUpdate(data);
        });

        socket.on('connect_error', (err) => {
            logger.error('Campaign socket connection error:', err.message);
        });

        return () => {
            socket.disconnect();
        };
    }, [user?.tenantId, handleUpdate]);
}
