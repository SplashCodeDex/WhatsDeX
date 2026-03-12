'use server';

import { redirect } from 'next/navigation';
import { api, API_ENDPOINTS } from '@/lib/api';
import type { ActionResult } from '@/types/api';

/**
 * Create a checkout session
 */
export async function createCheckoutSession(
    prevState: ActionResult<{ url: string }> | null,
    formData: FormData
): Promise<ActionResult<{ url: string }>> {
    const priceId = formData.get('priceId');
    const interval = formData.get('interval');

    if (!priceId) {
        return {
            success: false,
            error: { code: 'validation_error', message: 'Price ID is required' }
        };
    }

    const response = await api.post<{ url: string }>('/api/billing/checkout', {
        priceId,
        interval,
    });

    if (!response.success) {
        return {
            success: false,
            error: response.error,
        };
    }

    return { success: true, data: response.data };
}

/**
 * Create a portal session
 */
export async function createPortalSession(): Promise<ActionResult<{ url: string }>> {
    const response = await api.post<{ url: string }>('/api/billing/portal', {});

    if (!response.success) {
        return {
            success: false,
            error: response.error,
        };
    }

    return { success: true, data: response.data };
}
