'use client';

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

export function useUpdateContact() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, ...data }: Partial<Contact> & { id: string }) => {
            const response = await api.patch<Contact>(`/api/contacts/${id}`, data);
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

export function useCheckDuplicates() {
    return useMutation({
        mutationFn: async (phones: string[]) => {
            const response = await api.post<string[]>('/api/contacts/check-duplicates', { phones });
            if (!response.success) {
                throw new Error(response.error.message);
            }
            return response.data;
        }
    });
}

export function useImportHistory() {
    return useQuery({
        queryKey: [...contactKeys.all, 'history'],
        queryFn: async () => {
            const response = await api.get<any[]>('/api/contacts/imports');
            if (!response.success) {
                throw new Error(response.error.message);
            }
            return response.data;
        }
    });
}

export function useUndoImport() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: string) => {
            const response = await api.post(`/api/contacts/imports/${id}/undo`);
            if (!response.success) {
                throw new Error(response.error.message);
            }
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: contactKeys.list() });
            queryClient.invalidateQueries({ queryKey: contactKeys.all });
        }
    });
}
