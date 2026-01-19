'use client';

/**
 * useBots Hook
 *
 * TanStack Query-based hook for bot data fetching and mutations.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { api, API_ENDPOINTS } from '@/lib/api';
import { isApiSuccess } from '@/types';

import type { Bot, BotListItem, CreateBotInput, UpdateBotInput, QRCodeResponse } from '../types';

/**
 * Query key factory for bots
 */
export const botKeys = {
    all: ['bots'] as const,
    lists: () => [...botKeys.all, 'list'] as const,
    list: (filters: Record<string, unknown>) => [...botKeys.lists(), filters] as const,
    details: () => [...botKeys.all, 'detail'] as const,
    detail: (id: string) => [...botKeys.details(), id] as const,
    qr: (id: string) => [...botKeys.all, 'qr', id] as const,
};

/**
 * Fetch all bots
 */
export function useBots(): ReturnType<typeof useQuery<BotListItem[]>> {
    return useQuery({
        queryKey: botKeys.lists(),
        queryFn: async () => {
            const response = await api.get<BotListItem[]>(API_ENDPOINTS.BOTS.LIST);
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
export function useBot(botId: string): ReturnType<typeof useQuery<Bot>> {
    return useQuery({
        queryKey: botKeys.detail(botId),
        queryFn: async () => {
            const response = await api.get<Bot>(API_ENDPOINTS.BOTS.GET(botId));
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
export function useBotQR(botId: string, enabled: boolean = true): ReturnType<typeof useQuery<QRCodeResponse>> {
    return useQuery({
        queryKey: botKeys.qr(botId),
        queryFn: async () => {
            const response = await api.get<QRCodeResponse>(API_ENDPOINTS.BOTS.QR_CODE(botId));
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
export function useCreateBot(): ReturnType<typeof useMutation<Bot, Error, CreateBotInput>> {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (input: CreateBotInput) => {
            const response = await api.post<Bot>(API_ENDPOINTS.BOTS.CREATE, input);
            if (isApiSuccess(response)) {
                return response.data;
            }
            throw new Error(response.error.message);
        },
        onSuccess: () => {
            // Invalidate bot list to refetch
            queryClient.invalidateQueries({ queryKey: botKeys.lists() });
        },
    });
}

/**
 * Update bot mutation
 */
export function useUpdateBot(): ReturnType<typeof useMutation<Bot, Error, { id: string; data: UpdateBotInput }>> {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, data }: { id: string; data: UpdateBotInput }) => {
            const response = await api.patch<Bot>(API_ENDPOINTS.BOTS.UPDATE(id), data);
            if (isApiSuccess(response)) {
                return response.data;
            }
            throw new Error(response.error.message);
        },
        onSuccess: (data, { id }) => {
            // Update cache with new data
            queryClient.setQueryData(botKeys.detail(id), data);
            queryClient.invalidateQueries({ queryKey: botKeys.lists() });
        },
    });
}

/**
 * Delete bot mutation
 */
export function useDeleteBot(): ReturnType<typeof useMutation<void, Error, string>> {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (botId: string) => {
            const response = await api.delete(API_ENDPOINTS.BOTS.DELETE(botId));
            if (!isApiSuccess(response)) {
                throw new Error(response.error.message);
            }
        },
        onSuccess: (_, botId) => {
            // Remove from cache
            queryClient.removeQueries({ queryKey: botKeys.detail(botId) });
            queryClient.invalidateQueries({ queryKey: botKeys.lists() });
        },
    });
}

/**
 * Connect bot mutation
 */
export function useConnectBot(): ReturnType<typeof useMutation<void, Error, string>> {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (botId: string) => {
            const response = await api.post(API_ENDPOINTS.BOTS.CONNECT(botId));
            if (!isApiSuccess(response)) {
                throw new Error(response.error.message);
            }
        },
        onSuccess: (_, botId) => {
            queryClient.invalidateQueries({ queryKey: botKeys.detail(botId) });
            queryClient.invalidateQueries({ queryKey: botKeys.qr(botId) });
        },
    });
}

/**
 * Disconnect bot mutation
 */
export function useDisconnectBot(): ReturnType<typeof useMutation<void, Error, string>> {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (botId: string) => {
            const response = await api.post(API_ENDPOINTS.BOTS.DISCONNECT(botId));
            if (!isApiSuccess(response)) {
                throw new Error(response.error.message);
            }
        },
        onSuccess: (_, botId) => {
            queryClient.invalidateQueries({ queryKey: botKeys.detail(botId) });
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
 * Poll for bot status
 */
export function useBotStatus(botId: string, enabled: boolean) {
    return useQuery({
        queryKey: ['bot-status', botId],
        queryFn: async () => {
            const response = await api.get<{ status: string, isActive: boolean, hasQR: boolean }>(API_ENDPOINTS.BOTS.STATUS(botId));
            if (isApiSuccess(response)) {
                return response.data;
            }
            throw new Error(response.error.message);
        },
        enabled: enabled && !!botId,
        refetchInterval: 2000, // Poll every 2 seconds
    });
}
