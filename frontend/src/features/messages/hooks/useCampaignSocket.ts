'use client';

import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useCallback } from 'react';
import { toast } from 'sonner';

import { Campaign } from '@/features/messages/types';
import { useSocket } from '@/hooks/useSocket';

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

    const handleAntiBanAlert = useCallback((data: { 
        campaignId: string, 
        action: string, 
        reason: string, 
        cooldownSeconds: number,
        message: string 
    }) => {
        // Show warning toast
        toast.warning('Anti-Ban Protection Triggered', {
            description: data.message,
            duration: 10000, // Show for 10 seconds
        });

        // Update campaign status to paused and inject cooldown metadata
        const updateCache = (old: any) => {
            if (!old) return old;
            const updateFn = (c: Campaign) => {
                if (c.id === data.campaignId) {
                    return {
                        ...c,
                        status: 'paused' as const,
                        metadata: {
                            ...c.metadata,
                            antiban: {
                                reason: data.reason,
                                pausedAt: Date.now(),
                                cooldownSeconds: data.cooldownSeconds,
                                expiresAt: Date.now() + (data.cooldownSeconds * 1000)
                            }
                        }
                    };
                }
                return c;
            };

            if (Array.isArray(old)) return old.map(updateFn);
            return updateFn(old);
        };

        queryClient.setQueryData(['campaigns'], updateCache);
        queryClient.setQueryData(['campaign', data.campaignId], updateCache);
        
        // Also invalidate to be sure we are in sync with Firebase soon
        queryClient.invalidateQueries({ queryKey: ['campaign', data.campaignId] });
    }, [queryClient]);

    useEffect(() => {
        // Listen for campaign updates from the unified socket
        const cleanupUpdate = on('campaign_update', (data) => {
            handleUpdate(data);
        });

        // Listen for anti-ban alerts
        const cleanupAntiBan = on('antiban_alert', (data) => {
            handleAntiBanAlert(data);
        });

        return () => {
            cleanupUpdate();
            cleanupAntiBan();
        };
    }, [on, handleUpdate, handleAntiBanAlert]);
}
