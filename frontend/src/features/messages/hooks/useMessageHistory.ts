'use client';

import { useQuery } from '@tanstack/react-query';

import { type OmnichannelMessage } from '../types';

import { api } from '@/lib/api';

/**
 * Hook to fetch message history with omnichannel support.
 */
export function useMessageHistory(limit = 50) {
    return useQuery({
        queryKey: ['messages', 'history', limit],
        queryFn: async () => {
            const response = await api.get<OmnichannelMessage[]>(`/api/messages?limit=${limit}`);
            if (response.success) return response.data;
            throw new Error(response.error?.message || 'Failed to fetch messages');
        },
        refetchInterval: 10000,
    });
}
