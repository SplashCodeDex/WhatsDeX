'use client';

import { useEffect, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useSocket } from '@/hooks/useSocket';
import { Campaign } from '@/features/messages/types';

/**
 * Hook to manage campaign WebSocket connection and real-time updates
 */
export function useCampaignSocket() {
    const queryClient = useQueryClient();
    const { on } = useSocket();

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
        // Listen for campaign updates from the unified socket
        const cleanup = on('campaign_update', (data) => {
            handleUpdate(data);
        });

        return cleanup;
    }, [on, handleUpdate]);
}
