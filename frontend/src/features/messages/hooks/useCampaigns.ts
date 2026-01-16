import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api/apiClient.js';
import { ENDPOINTS } from '@/lib/api/endpoints.js';
import { Campaign } from '../types.js';

export const campaignKeys = {
    all: ['campaigns'] as const,
    list: () => [...campaignKeys.all, 'list'] as const,
    detail: (id: string) => [...campaignKeys.all, 'detail', id] as const,
};

export function useCampaigns() {
    return useQuery({
        queryKey: campaignKeys.list(),
        queryFn: async () => {
            const response = await api.get<{ success: true; data: Campaign[] }>('/api/campaigns');
            return response.data;
        },
    });
}

export function useCreateCampaign() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (data: Partial<Campaign>) => {
            const response = await api.post<{ success: true; data: Campaign }>('/api/campaigns', data);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: campaignKeys.list() });
        },
    });
}

export function useStartCampaign() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: string) => {
            const response = await api.post<{ success: true }>(`/api/campaigns/${id}/start`);
            return response;
        },
        onSuccess: (_, id) => {
            queryClient.invalidateQueries({ queryKey: campaignKeys.list() });
            queryClient.invalidateQueries({ queryKey: campaignKeys.detail(id) });
        },
    });
}

export function useDeleteCampaign() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: string) => {
            const response = await api.delete<{ success: true }>(`/api/campaigns/${id}`);
            return response;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: campaignKeys.list() });
        },
    });
}
