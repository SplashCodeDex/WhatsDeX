import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api/client';

export function useAudiences() {
    return useQuery({
        queryKey: ['audiences'],
        queryFn: async () => {
            // Placeholder: The backend endpoint might not exist yet
            // or might be /api/contacts/audiences
            const response = await api.get<any[]>('/api/contacts/audiences').catch(() => ({ success: true, data: [] }));
            if (!response.success) {
                return [];
            }
            return response.data || [];
        }
    });
}
