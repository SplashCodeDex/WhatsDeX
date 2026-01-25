'use server';

import { revalidatePath } from 'next/cache';
import { api, API_ENDPOINTS } from '@/lib/api';
import type { Result } from '@/types/api';

/**
 * Update tenant settings
 */
export async function updateTenantSettings(
    prevState: Result<any> | null,
    formData: FormData
): Promise<Result<any>> {
    const jsonData = formData.get('data');
    if (!jsonData || typeof jsonData !== 'string') {
        return {
            success: false,
            error: { code: 'validation_error', message: 'Missing settings data' }
        };
    }

    let updates;
    try {
        updates = JSON.parse(jsonData);
    } catch (e) {
        return {
            success: false,
            error: { code: 'validation_error', message: 'Invalid JSON data' }
        };
    }

    const response = await api.patch<any>('/api/tenant/settings', updates);

    if (!response.success) {
        return {
            success: false,
            error: response.error,
        };
    }

    revalidatePath('/dashboard/settings');
    return { success: true, data: response.data };
}
