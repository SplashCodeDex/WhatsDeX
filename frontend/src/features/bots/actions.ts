'use server';

import { revalidatePath } from 'next/cache';
import { api, API_ENDPOINTS } from '@/lib/api';
import { createBotSchema, updateBotSchema, type UpdateBotInput } from './schemas';
import type { Result } from '@/types/api';
import type { Bot } from './types';

/**
 * Create a new bot
 * Compatible with useActionState
 */
export async function createBot(
    prevState: Result<Bot> | null,
    formData: FormData
): Promise<Result<Bot>> {
    // 1. Validate Input
    const rawData = {
        name: formData.get('name'),
        type: formData.get('type') || 'whatsapp',
        credentials: {
            token: formData.get('token'),
        },
    };

    const parsed = createBotSchema.safeParse(rawData);

    if (!parsed.success) {
        return {
            success: false,
            error: {
                code: 'validation_error',
                message: 'Invalid input',
                details: parsed.error.flatten().fieldErrors,
            },
        };
    }

    // 2. Call API
    const response = await api.post<Bot>(API_ENDPOINTS.BOTS.CREATE, parsed.data);

    if (!response.success) {
        return {
            success: false,
            error: response.error,
        };
    }

    // 3. Revalidate
    revalidatePath('/dashboard/bots');

    return { success: true, data: response.data };
}

/**
 * Update an existing bot
 * Supports a 'data' JSON field in formData for complex updates.
 */
export async function updateBot(
    botId: string,
    prevState: Result<Bot> | null,
    formData: FormData
): Promise<Result<Bot>> {
    let rawData: unknown;
    
    // Check for JSON payload first (used for complex config updates)
    const jsonData = formData.get('data');
    if (jsonData && typeof jsonData === 'string') {
        try {
            rawData = JSON.parse(jsonData);
        } catch (e) {
            return {
                success: false,
                error: { code: 'validation_error', message: 'Invalid JSON data' }
            };
        }
    } else {
        // Fallback or other handling could go here. 
        // For now, we expect JSON for the complex schema.
        rawData = {}; 
    }

    const parsed = updateBotSchema.safeParse(rawData);

    if (!parsed.success) {
        return {
            success: false,
            error: {
                code: 'validation_error',
                message: 'Invalid input',
                details: parsed.error.flatten().fieldErrors,
            },
        };
    }

    const response = await api.patch<Bot>(API_ENDPOINTS.BOTS.UPDATE(botId), parsed.data);

    if (!response.success) {
        return {
            success: false,
            error: response.error,
        };
    }

    revalidatePath('/dashboard/bots');
    return { success: true, data: response.data };
}

/**
 * Delete a bot
 */
export async function deleteBot(
    botId: string,
    prevState: Result<null> | null,
    formData: FormData
): Promise<Result<null>> {
    const response = await api.delete<null>(API_ENDPOINTS.BOTS.DELETE(botId));

    if (!response.success) {
        return {
            success: false,
            error: response.error,
        };
    }

    revalidatePath('/dashboard/bots');
    return { success: true, data: null };
}

/**
 * Connect (Start) a bot
 */
export async function connectBot(
    botId: string,
    prevState: Result<null> | null,
    formData: FormData
): Promise<Result<null>> {
    const response = await api.post<null>(API_ENDPOINTS.BOTS.CONNECT(botId));

    if (!response.success) {
        return {
            success: false,
            error: response.error,
        };
    }

    revalidatePath('/dashboard/bots');
    return { success: true, data: null };
}

/**
 * Disconnect (Stop) a bot
 */
export async function disconnectBot(
    botId: string,
    prevState: Result<null> | null,
    formData: FormData
): Promise<Result<null>> {
    const response = await api.post<null>(API_ENDPOINTS.BOTS.DISCONNECT(botId));

    if (!response.success) {
        return {
            success: false,
            error: response.error,
        };
    }

    revalidatePath('/dashboard/bots');
    return { success: true, data: null };
}