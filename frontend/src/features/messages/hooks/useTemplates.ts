import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api/client';
import { MessageTemplate } from '../types';

export const templateKeys = {
    all: ['templates'] as const,
    list: () => [...templateKeys.all, 'list'] as const,
};

export function useTemplates() {
    return useQuery({
        queryKey: templateKeys.list(),
        queryFn: async () => {
            const response = await api.get<MessageTemplate[]>('/api/templates');
            if (!response.success) {
                throw new Error(response.error.message);
            }
            return response.data;
        }
    });
}

export function useCreateTemplate() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (data: Partial<MessageTemplate>) => {
            const response = await api.post<MessageTemplate>('/api/templates', data);
            if (!response.success) {
                throw new Error(response.error.message);
            }
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: templateKeys.list() });
        },
    });
}

export function useSpinMessage() {
    return useMutation({
        mutationFn: async (content: string) => {
            const response = await api.post<string>('/api/templates/spin', { content });
            if (!response.success) {
                throw new Error(response.error.message);
            }
            return response.data;
        }
    });
}
