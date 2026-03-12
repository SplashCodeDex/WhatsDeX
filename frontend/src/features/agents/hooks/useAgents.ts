'use client';

import { useQuery } from '@tanstack/react-query';

import { api } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/api/endpoints';
import { isApiSuccess } from '@/types';

export interface AgentChannel {
    id: string;
    name: string;
    type: string;
    status: 'connected' | 'disconnected' | 'connecting' | 'error';
    phoneNumber?: string;
    account?: string;
    messageCount?: number;
    lastActiveAt?: string;
    assignedAgentId?: string;
}

export const agentKeys = {
    all: ['agents'] as const,
    channels: (agentId?: string) => [...agentKeys.all, 'channels', agentId || 'all'] as const,
};

/**
 * useAgents Hook
 * Fetches the list of active/connected agent channels (formerly 'bots').
 * Defaults to 'system_default' if no agentId is provided.
 */
export function useAgents(agentId: string = 'system_default') {
    return useQuery({
        queryKey: agentKeys.channels(agentId),
        queryFn: async () => {
            const endpoint = agentId === 'all'
                ? API_ENDPOINTS.OMNICHANNEL.CHANNELS.ALL
                : API_ENDPOINTS.OMNICHANNEL.AGENTS.CHANNELS.LIST(agentId);

            const response = await api.get<any[]>(endpoint);

            if (isApiSuccess(response)) {
                const data = response.data || [];
                return data.map(channel => ({
                    id: channel.id,
                    name: channel.name,
                    type: channel.type || 'whatsapp',
                    status: channel.status as any,
                    phoneNumber: channel.phoneNumber || channel.account || null,
                    messageCount: channel.messageCount || 0,
                    lastActiveAt: channel.lastActiveAt,
                    assignedAgentId: channel.assignedAgentId
                })) as AgentChannel[];
            }

            throw new Error(response.error.message || 'Failed to fetch agent channels');
        },
        retry: 1,
        staleTime: 30000, // 30 seconds
    });
}
