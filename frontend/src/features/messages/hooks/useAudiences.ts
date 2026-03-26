'use client';

import { useQuery, type UseQueryResult } from '@tanstack/react-query';

import { api } from '@/lib/api/client';

interface Audience {
    id: string;
    name: string;
    count: number;
    [key: string]: unknown;
}

export function useAudiences(): UseQueryResult<Audience[]> {
    return useQuery({
        queryKey: ['audiences'],
        queryFn: async () => {
            const response = await api.get<Audience[]>('/api/contacts/audiences');
            if (!response.success) {
                return [];
            }
            return response.data || [];
        }
    });
}
