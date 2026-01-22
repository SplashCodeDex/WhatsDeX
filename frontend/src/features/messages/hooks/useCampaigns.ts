import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api/client';
import { Campaign } from '../types';
import { useCampaignSocket } from './useCampaignSocket';

export const campaignKeys = {
    all: ['campaigns'] as const,
    list: () => [...campaignKeys.all, 'list'] as const,
    detail: (id: string) => [...campaignKeys.all, 'detail', id] as const,
};

export function useCampaigns() {
    // Initialize socket connection for real-time updates
    useCampaignSocket();

    return useQuery({
        queryKey: campaignKeys.list(),
        queryFn: async () => {
            const response = await api.get<Campaign[]>('/api/campaigns');
            if (!response.success) {
                throw new Error(response.error.message);
            }
            return response.data;
        }
    });
}

export function useCampaign(id: string) {
    return useQuery({
        queryKey: campaignKeys.detail(id),
        queryFn: async () => {
            const response = await api.get<Campaign>(`/api/campaigns/${id}`);
            if (!response.success) {
                throw new Error(response.error.message);
            }
            return response.data;
        },
        enabled: !!id,
    });
}

export function useCreateCampaign() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (data: Partial<Campaign>) => {
            const response = await api.post<Campaign>('/api/campaigns', data);
            if (!response.success) {
                throw new Error(response.error.message);
            }
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
            const response = await api.post<{ message: string }>(`/api/campaigns/${id}/start`);
            if (!response.success) {
                throw new Error(response.error.message || 'Failed to start campaign');
            }
            return response.data;
        },
        onSuccess: (_, id) => {
            queryClient.invalidateQueries({ queryKey: campaignKeys.list() });
            queryClient.invalidateQueries({ queryKey: campaignKeys.detail(id) });
        },
    });
}

export function usePauseCampaign() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: string) => {
            const response = await api.post<{ message: string }>(`/api/campaigns/${id}/pause`);
            if (!response.success) {
                throw new Error(response.error.message || 'Failed to pause campaign');
            }
            return response.data;
        },
        onSuccess: (_, id) => {
            queryClient.invalidateQueries({ queryKey: campaignKeys.list() });
            queryClient.invalidateQueries({ queryKey: campaignKeys.detail(id) });
        },
    });
}

export function useResumeCampaign() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: string) => {
            const response = await api.post<{ message: string }>(`/api/campaigns/${id}/resume`);
            if (!response.success) {
                throw new Error(response.error.message || 'Failed to resume campaign');
            }
            return response.data;
        },
        onSuccess: (_, id) => {
            queryClient.invalidateQueries({ queryKey: campaignKeys.list() });
            queryClient.invalidateQueries({ queryKey: campaignKeys.detail(id) });
        },
    });
}

export function useDuplicateCampaign() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: string) => {
            const response = await api.post<Campaign>(`/api/campaigns/${id}/duplicate`);
            if (!response.success) {
                throw new Error(response.error.message);
            }
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: campaignKeys.list() });
        },
    });
}

export function useDeleteCampaign() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: string) => {
            const response = await api.delete<{ message: string }>(`/api/campaigns/${id}`);
            if (!response.success) {
                throw new Error(response.error.message || 'Failed to delete campaign');
            }
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: campaignKeys.list() });
        },
    });
}
