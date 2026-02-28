'use client';

/**
 * useBots Hook
 *
 * TanStack Query-based hook for bot data fetching and mutations.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { doc } from 'firebase/firestore';

import { api, API_ENDPOINTS } from '@/lib/api';
import { getClientFirestore } from '@/lib/firebase/client';
import { useFirestoreLive } from '@/hooks/useFirestoreLive';
import { isApiSuccess } from '@/types';

import type { Bot, BotListItem, BotStatus, BotConfig, QRCodeResponse } from '../types';
import type { CreateBotInput, UpdateBotInput } from '../schemas';
import { useAuth } from '@/features/auth';

/**
 * Query key factory for bots
 */
export const botKeys = {
    all: ['bots'] as const,
    lists: (agentId: string = 'system_default') => [...botKeys.all, 'list', agentId] as const,
    list: (agentId: string, filters: Record<string, unknown>) => [...botKeys.lists(agentId), filters] as const,
    details: (agentId: string) => [...botKeys.all, 'detail', agentId] as const,
    detail: (agentId: string, id: string) => [...botKeys.details(agentId), id] as const,
    qr: (agentId: string, id: string) => [...botKeys.all, 'qr', agentId, id] as const,
    status: (agentId: string, id: string) => ['bot-status', agentId, id] as const,
};

/**
 * Fetch all bots for an agent
 */
export function useBots(agentId: string = 'system_default'): ReturnType<typeof useQuery<BotListItem[]>> {
    return useQuery({
        queryKey: botKeys.lists(agentId),
        queryFn: async () => {
            const response = await api.get<BotListItem[]>(API_ENDPOINTS.OMNICHANNEL.AGENTS.CHANNELS.LIST(agentId));
            if (isApiSuccess(response)) {
                return response.data;
            }
            throw new Error(response.error.message);
        },
    });
}

/**
 * Fetch single bot by ID
 */
export function useBot(botId: string, agentId: string = 'system_default'): ReturnType<typeof useQuery<Bot>> {
    return useQuery({
        queryKey: botKeys.detail(agentId, botId),
        queryFn: async () => {
            const response = await api.get<Bot>(API_ENDPOINTS.OMNICHANNEL.AGENTS.CHANNELS.GET(agentId, botId));
            if (isApiSuccess(response)) {
                return response.data;
            }
            throw new Error(response.error.message);
        },
        enabled: !!botId,
    });
}

/**
 * Fetch QR code for bot connection
 */
export function useBotQR(botId: string, enabled: boolean = true, agentId: string = 'system_default'): ReturnType<typeof useQuery<QRCodeResponse>> {
    return useQuery({
        queryKey: botKeys.qr(agentId, botId),
        queryFn: async () => {
            const response = await api.get<QRCodeResponse>(API_ENDPOINTS.OMNICHANNEL.AGENTS.CHANNELS.QR_CODE(agentId, botId));
            if (isApiSuccess(response)) {
                return response.data;
            }
            throw new Error(response.error.message);
        },
        enabled: enabled && !!botId,
        // QR codes expire, so refetch frequently
        refetchInterval: 30000,
        staleTime: 20000,
    });
}

/**
 * Create bot mutation
 */
export function useCreateBot(agentId: string = 'system_default'): ReturnType<typeof useMutation<Bot, Error, CreateBotInput>> {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (input: CreateBotInput) => {
            const response = await api.post<Bot>(API_ENDPOINTS.OMNICHANNEL.AGENTS.CHANNELS.CREATE(agentId), input);
            if (isApiSuccess(response)) {
                return response.data;
            }
            throw new Error(response.error.message);
        },
        onSuccess: () => {
            // Invalidate bot list to refetch
            queryClient.invalidateQueries({ queryKey: botKeys.lists(agentId) });
        },
    });
}

/**
 * Update bot mutation
 */
export function useUpdateBot(agentId: string = 'system_default'): ReturnType<typeof useMutation<Bot, Error, { id: string; data: UpdateBotInput }>> {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, data }: { id: string; data: UpdateBotInput }) => {
            const response = await api.patch<Bot>(API_ENDPOINTS.OMNICHANNEL.AGENTS.CHANNELS.UPDATE(agentId, id), data);
            if (isApiSuccess(response)) {
                return response.data;
            }
            throw new Error(response.error.message);
        },
        onSuccess: (data, { id }) => {
            // Update cache with new data
            queryClient.setQueryData(botKeys.detail(agentId, id), data);
            queryClient.invalidateQueries({ queryKey: botKeys.lists(agentId) });
        },
    });
}

/**
 * Delete bot mutation
 */
export function useDeleteBot(agentId: string = 'system_default'): ReturnType<typeof useMutation<void, Error, string>> {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (botId: string) => {
            const response = await api.delete(API_ENDPOINTS.OMNICHANNEL.AGENTS.CHANNELS.DELETE(agentId, botId));
            if (!isApiSuccess(response)) {
                throw new Error(response.error.message);
            }
        },
        onSuccess: (_, botId) => {
            // Remove from cache
            queryClient.removeQueries({ queryKey: botKeys.detail(agentId, botId) });
            queryClient.invalidateQueries({ queryKey: botKeys.lists(agentId) });
        },
    });
}

/**
 * Connect bot mutation
 */
export function useConnectBot(agentId: string = 'system_default'): ReturnType<typeof useMutation<void, Error, string>> {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (botId: string) => {
            const response = await api.post(API_ENDPOINTS.OMNICHANNEL.AGENTS.CHANNELS.CONNECT(agentId, botId));
            if (!isApiSuccess(response)) {
                throw new Error(response.error.message);
            }
        },
        onSuccess: (_, botId) => {
            queryClient.invalidateQueries({ queryKey: botKeys.detail(agentId, botId) });
            queryClient.invalidateQueries({ queryKey: botKeys.qr(agentId, botId) });
        },
    });
}

/**
 * Disconnect bot mutation
 */
export function useDisconnectBot(agentId: string = 'system_default'): ReturnType<typeof useMutation<void, Error, string>> {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (botId: string) => {
            const response = await api.post(API_ENDPOINTS.OMNICHANNEL.AGENTS.CHANNELS.DISCONNECT(agentId, botId));
            if (!isApiSuccess(response)) {
                throw new Error(response.error.message);
            }
        },
        onSuccess: (_, botId) => {
            queryClient.invalidateQueries({ queryKey: botKeys.detail(agentId, botId) });
        },
    });
}

/**
 * Get Pairing Code mutation
 */
export function usePairingCode(botId: string) {
    return useMutation({
        mutationFn: async (phoneNumber: string) => {
            const response = await api.post<{ pairingCode: string }>(API_ENDPOINTS.BOTS.PAIRING_CODE(botId), { phoneNumber });
            if (isApiSuccess(response)) {
                return response.data;
            }
            throw new Error(response.error.message);
        }
    });
}

/**
 * Poll for bot status (Now using Firestore Snapshots)
 */
export function useBotStatus(botId: string, enabled: boolean, agentId: string = 'system_default') {
    const { user } = useAuth();
    const db = getClientFirestore();
    const tenantId = user?.tenantId;

    // Build the hierarchical Firestore reference for the channel
    const botDocRef = tenantId && botId
        ? doc(db, 'tenants', tenantId, 'agents', agentId, 'channels', botId)
        : null;

    // Use our live hook to keep the query key in sync
    useFirestoreLive(botKeys.status(agentId, botId), botDocRef, enabled && !!tenantId);

    return useQuery({
        queryKey: botKeys.status(agentId, botId),
        queryFn: async () => {
            const response = await api.get<{ status: string, isActive: boolean, hasQR: boolean }>(API_ENDPOINTS.OMNICHANNEL.AGENTS.CHANNELS.STATUS(agentId, botId));
            if (isApiSuccess(response)) {
                return response.data;
            }
            throw new Error(response.error.message);
        },
        enabled: enabled && !!botId,
        staleTime: Infinity, // Rely on Firestore for updates
    });
}
