'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { TenantSettings } from '../types';
import { toast } from 'sonner';

export function useSettings() {
    const queryClient = useQueryClient();

    const query = useQuery({
        queryKey: ['tenant-settings'],
        queryFn: async () => {
            const response = await api.get<TenantSettings>('/api/tenant/settings');
            if (response.success) return response.data;
            throw new Error(response.error?.message || 'Failed to fetch settings');
        },
    });

    const mutation = useMutation({
        mutationFn: async (updates: Partial<TenantSettings>) => {
            const response = await api.patch<TenantSettings>('/api/tenant/settings', updates);
            if (response.success) return response.data;
            throw new Error(response.error?.message || 'Failed to update settings');
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tenant-settings'] });
            toast.success('Settings updated successfully');
        },
        onError: (error: Error) => {
            toast.error(error.message);
        },
    });

    return {
        settings: query.data,
        isLoading: query.isLoading,
        error: query.error,
        updateSettings: mutation.mutate,
        isUpdating: mutation.isPending,
    };
}
