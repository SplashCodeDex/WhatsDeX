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
    const agentId = (formData.get('agentId') as string) || 'system_default';

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
    const response = await api.post<Bot>(API_ENDPOINTS.OMNICHANNEL.AGENTS.CHANNELS.CREATE(agentId), parsed.data);

    if (!response.success) {
        return {
            success: false,
            error: response.error,
        };
    }

    // 3. Revalidate
    revalidatePath('/dashboard/bots');
    revalidatePath('/dashboard/omnichannel');
    revalidatePath('/dashboard/agents');

    return { success: true, data: response.data };
}

/**
 * Update an existing bot
 * Supports a 'data' JSON field in formData for complex updates.
 */
export async function updateBot(
    botId: string,
    agentId: string = 'system_default',
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

    const response = await api.patch<Bot>(API_ENDPOINTS.OMNICHANNEL.AGENTS.CHANNELS.UPDATE(agentId, botId), parsed.data);

    if (!response.success) {
        return {
            success: false,
            error: response.error,
        };
    }

    revalidatePath('/dashboard/bots');
    revalidatePath('/dashboard/omnichannel');
    revalidatePath('/dashboard/agents');
    return { success: true, data: response.data };
}

/**
 * Delete a bot
 */
export async function deleteBot(
    botId: string,
    agentId: string = 'system_default',
    prevState: Result<null> | null,
    formData: FormData
): Promise<Result<null>> {
    const response = await api.delete<null>(API_ENDPOINTS.OMNICHANNEL.AGENTS.CHANNELS.DELETE(agentId, botId));

    if (!response.success) {
        return {
            success: false,
            error: response.error,
        };
    }

    revalidatePath('/dashboard/bots');
    revalidatePath('/dashboard/omnichannel');
    revalidatePath('/dashboard/agents');
    return { success: true, data: null };
}

/**
 * Connect (Start) a bot
 */
export async function connectBot(
    botId: string,
    agentId: string = 'system_default',
    prevState: Result<null> | null,
    formData: FormData
): Promise<Result<null>> {
    const response = await api.post<null>(API_ENDPOINTS.OMNICHANNEL.AGENTS.CHANNELS.CONNECT(agentId, botId));

    if (!response.success) {
        return {
            success: false,
            error: response.error,
        };
    }

    revalidatePath('/dashboard/bots');
    revalidatePath('/dashboard/omnichannel');
    revalidatePath('/dashboard/agents');
    return { success: true, data: null };
}

/**
 * Disconnect (Stop) a bot
 */
export async function disconnectBot(
    botId: string,
    agentId: string = 'system_default',
    prevState: Result<null> | null,
    formData: FormData
): Promise<Result<null>> {
    const response = await api.post<null>(API_ENDPOINTS.OMNICHANNEL.AGENTS.CHANNELS.DISCONNECT(agentId, botId));

    if (!response.success) {
        return {
            success: false,
            error: response.error,
        };
    }

    revalidatePath('/dashboard/bots');
    revalidatePath('/dashboard/omnichannel');
    revalidatePath('/dashboard/agents');
    return { success: true, data: null };
}

/**
 * Fetch categorized commands for bots
 */
export async function getCommands(): Promise<Result<Record<string, { name: string; desc: string }[]>>> {
    return await api.get<Record<string, { name: string; desc: string }[]>>(API_ENDPOINTS.BOTS.COMMANDS);
}
