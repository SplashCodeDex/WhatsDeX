import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { type OmnichannelMessage } from '../types';

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
