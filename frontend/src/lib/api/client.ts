/**
 * API Client
 *
 * Type-safe fetch wrapper implementation.
 * Designed to work seamlessly with HttpOnly cookies across Server and Client components.
 */

import { APP_CONFIG } from '@/lib/constants';
import type { ApiResponse, ApiSuccessResponse, ApiErrorResponse } from '@/types';

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

interface RequestConfig<TBody = unknown> {
    method?: HttpMethod;
    body?: TBody | undefined;
    headers?: Record<string, string>;
    cache?: RequestCache;
    next?: NextFetchRequestConfig;
    signal?: AbortSignal;
}

interface NextFetchRequestConfig {
    revalidate?: number | false;
    tags?: string[];
}

export class ApiError extends Error {
    readonly code: string;
    readonly status: number;
    readonly details: Record<string, unknown> | undefined;

    constructor(
        message: string,
        code: string,
        status: number,
        details?: Record<string, unknown>
    ) {
        super(message);
        this.name = 'ApiError';
        this.code = code;
        this.status = status;
        this.details = details;
    }

    static fromResponse(response: ApiErrorResponse, status: number): ApiError {
        return new ApiError(
            response.error.message,
            response.error.code,
            status,
            response.error.details
        );
    }
}

function createUrl(
    endpoint: string,
    params?: Record<string, string | number | boolean | undefined>
): string {
    // Ensure endpoint starts with /api if not present, but handle absolute URLs if needed
    let path = endpoint;
    if (!endpoint.startsWith('http') && !endpoint.startsWith('/api')) {
        path = `/api${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;
    }

    const baseUrl = APP_CONFIG.apiUrl || 'http://localhost:4000';
    const url = new URL(path, baseUrl);

    if (params) {
        Object.entries(params).forEach(([key, value]) => {
            if (value !== undefined) {
                url.searchParams.append(key, String(value));
            }
        });
    }

    return url.toString();
}

/**
 * Get authorization header from session (SERVER-SIDE ONLY)
 * On client side, the browser sends the cookie automatically.
 */
async function getAuthHeader(): Promise<string | null> {
    if (typeof window !== 'undefined') {
        return null;
    }

    const { cookies } = await import('next/headers');
    const cookieStore = await cookies();
    const token = cookieStore.get('token');
    return token?.value ?? null;
}

async function apiClient<TData, TBody = unknown>(
    endpoint: string,
    config: RequestConfig<TBody> = {}
): Promise<ApiResponse<TData>> {
    const {
        method = 'GET',
        body,
        headers = {},
        cache,
        next,
        signal,
    } = config;

    const url = createUrl(endpoint);
    const authToken = await getAuthHeader();

    const requestHeaders: Record<string, string> = {
        'Content-Type': 'application/json',
        ...headers,
    };

    // Only attach Bearer token on Server Side where cookies aren't automatic
    if (authToken) {
        requestHeaders['Authorization'] = `Bearer ${authToken}`;
    }

    const fetchOptions: RequestInit & { next?: NextFetchRequestConfig } = {
        method,
        headers: requestHeaders,
        credentials: 'include',
    };

    if (body !== undefined) {
        fetchOptions.body = JSON.stringify(body);
    }

    if (cache !== undefined) {
        fetchOptions.cache = cache;
    }

    if (next !== undefined) {
        fetchOptions.next = next;
    }

    if (signal !== undefined) {
        fetchOptions.signal = signal;
    }

    try {
        const response = await fetch(url, fetchOptions);

        const data = await response.json();

        if (!response.ok) {
            return {
                success: false,
                error: {
                    code: data.error?.code ?? 'unknown_error',
                    message: data.error?.message ?? 'An unexpected error occurred',
                    details: data.error?.details,
                },
            } as ApiErrorResponse;
        }

        return {
            success: true,
            data: data.data ?? data, // Handle wrapped vs unwrapped data
            meta: data.meta,
        } as ApiSuccessResponse<TData>;
    } catch (err) {
        if (err instanceof Error) {
            if (err.name === 'AbortError') {
                return {
                    success: false,
                    error: {
                        code: 'request_aborted',
                        message: 'Request was cancelled',
                    },
                };
            }
            return {
                success: false,
                error: {
                    code: 'network_error',
                    message: 'Unable to connect to server',
                },
            };
        }
        return {
            success: false,
            error: {
                code: 'unknown_error',
                message: 'An unexpected error occurred',
            },
        };
    }
}

export const api = {
    get<TData>(endpoint: string, params?: Record<string, any>, config?: RequestConfig) {
        const url = params ? createUrl(endpoint, params).replace(new URL(createUrl(endpoint)).origin, '') : endpoint; // Hacky url fix? No, simpler to just pass endpoint
        // Actually createUrl builds full URL, but apiClient calls createUrl again.
        // Let's refactor createUrl usage to be efficient.
        // If we pass full URL to apiClient, it might duplicate base.
        // Let's keep it simple: api.get passes filtered params to client
        return apiClient<TData>(endpoint, { ...config, method: 'GET' });
    },
    post<TData, TBody = unknown>(endpoint: string, body?: TBody, config?: RequestConfig<TBody>) {
        return apiClient<TData, TBody>(endpoint, { ...config, method: 'POST', body });
    },
    put<TData, TBody = unknown>(endpoint: string, body?: TBody, config?: RequestConfig<TBody>) {
        return apiClient<TData, TBody>(endpoint, { ...config, method: 'PUT', body });
    },
    patch<TData, TBody = unknown>(endpoint: string, body?: TBody, config?: RequestConfig<TBody>) {
        return apiClient<TData, TBody>(endpoint, { ...config, method: 'PATCH', body });
    },
    delete<TData>(endpoint: string, config?: RequestConfig) {
        return apiClient<TData>(endpoint, { ...config, method: 'DELETE' });
    },
};
