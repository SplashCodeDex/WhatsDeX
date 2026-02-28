'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api/client';

export function useAudiences() {
    return useQuery({
        queryKey: ['audiences'],
        queryFn: async () => {
            const response = await api.get<any[]>('/api/contacts/audiences');
            if (!response.success) {
                return [];
            }
            return response.data || [];
        }
    });
}
