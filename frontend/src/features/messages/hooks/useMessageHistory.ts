import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

export interface Message {
    id: string;
    botId: string;
    to: string;
    text: string;
    timestamp: any;
    status: 'sent' | 'delivered' | 'read' | 'failed';
    type: 'text' | 'image' | 'video' | 'document';
}

export function useMessageHistory(limit = 50) {
    return useQuery({
        queryKey: ['messages', 'history', limit],
        queryFn: async () => {
            const response = await api.get<Message[]>(`/api/messages?limit=${limit}`);
            if (response.success) return response.data;
            throw new Error(response.error?.message || 'Failed to fetch messages');
        },
        refetchInterval: 10000, // Poll every 10s for now, or use socket later
    });
}
