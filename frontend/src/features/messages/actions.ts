'use server';

import { revalidatePath } from 'next/cache';
import { api } from '@/lib/api';
import type { Result } from '@/types/api';

/**
 * Create a new campaign
 */
export async function createCampaign(
    prevState: Result<any> | null,
    formData: FormData
): Promise<Result<any>> {
    const jsonData = formData.get('data');
    if (!jsonData || typeof jsonData !== 'string') {
        return {
            success: false,
            error: { code: 'validation_error', message: 'Missing campaign data' }
        };
    }

    let data;
    try {
        data = JSON.parse(jsonData);
    } catch (e) {
        return {
            success: false,
            error: { code: 'validation_error', message: 'Invalid JSON data' }
        };
    }

    const response = await api.post<any>('/api/campaigns', data);

    if (!response.success) {
        return {
            success: false,
            error: response.error,
        };
    }

    revalidatePath('/dashboard/campaigns');
    return { success: true, data: response.data };
}

/**
 * Start a campaign
 */
export async function startCampaignAction(id: string): Promise<Result<{ message: string }>> {
    const response = await api.post<{ message: string }>(`/api/campaigns/${id}/start`, {});
    if (!response.success) return { success: false, error: response.error };
    revalidatePath('/dashboard/campaigns');
    return { success: true, data: response.data };
}

/**
 * Pause a campaign
 */
export async function pauseCampaignAction(id: string): Promise<Result<{ message: string }>> {
    const response = await api.post<{ message: string }>(`/api/campaigns/${id}/pause`, {});
    if (!response.success) return { success: false, error: response.error };
    revalidatePath('/dashboard/campaigns');
    return { success: true, data: response.data };
}
