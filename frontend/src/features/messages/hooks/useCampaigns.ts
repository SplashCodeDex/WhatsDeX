import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api/client';
import { Campaign } from '../types';

export const campaignKeys = {
    all: ['campaigns'] as const,
    list: () => [...campaignKeys.all, 'list'] as const,
    detail: (id: string) => [...campaignKeys.all, 'detail', id] as const,
};

export function useCampaigns() {
    return useQuery({
        queryKey: campaignKeys.list(),
        queryFn: async () => {
            const response = await api.get<Campaign[]>('/api/campaigns');
            if (!response.success) {
                throw new Error(response.error.message);
            }
            return response.data;
        },
        // Poll every 5 seconds if any campaign is actively sending
        refetchInterval: (query) => {
            const campaigns = query.state.data as Campaign[] | undefined;
            const hasActive = campaigns?.some(c => c.status === 'sending');
            return hasActive ? 5000 : false;
        },
        refetchIntervalInBackground: true,
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
            const response = await api.post<{ success: true }>(`/api/campaigns/${id}/start`);
            return response;
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
            const response = await api.post<{ success: true }>(`/api/campaigns/${id}/pause`);
            return response;
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
            const response = await api.post<{ success: true }>(`/api/campaigns/${id}/resume`);
            return response;
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
            const response = await api.delete<{ success: true }>(`/api/campaigns/${id}`);
            return response;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: campaignKeys.list() });
        },
    });
}
