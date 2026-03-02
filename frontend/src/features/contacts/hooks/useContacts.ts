import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api/client';
import { Contact, ContactImportResult, Audience } from '../types';

export const contactKeys = {
    all: ['contacts'] as const,
    list: () => [...contactKeys.all, 'list'] as const,
    audiences: () => [...contactKeys.all, 'audiences'] as const,
};

export function useContacts() {
    return useQuery({
        queryKey: contactKeys.list(),
        queryFn: async () => {
            const response = await api.get<Contact[]>('/api/contacts');
            if (!response.success) {
                throw new Error(response.error.message);
            }
            return response.data;
        }
    });
}

export function useAudiences() {
    return useQuery({
        queryKey: contactKeys.audiences(),
        queryFn: async () => {
            const response = await api.get<Audience[]>('/api/contacts/audiences');
            if (!response.success) {
                throw new Error(response.error.message);
            }
            return response.data;
        }
    });
}

export function useImportContacts() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (csvData: string) => {
            const response = await api.post<ContactImportResult>('/api/contacts/import', { csvData });
            if (!response.success) {
                throw new Error(response.error.message);
            }
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: contactKeys.list() });
            queryClient.invalidateQueries({ queryKey: contactKeys.audiences() });
        }
    });
}

export function useDeleteContact() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: string) => {
            const response = await api.delete(`/api/contacts/${id}`);
            if (!response.success) {
                throw new Error(response.error.message);
            }
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: contactKeys.list() });
        }
    });
}
