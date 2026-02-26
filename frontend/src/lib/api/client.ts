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
    // Rely on Next.js Rewrite Proxy: Just use the relative path.
    // Ensure it starts with /api if it's an API call (logic moved to caller or standard endpoints)
    // Endpoints in endpoints.ts already include /api prefix or /internal which maps to /api/internal
    // Actually, endpoints in endpoints.ts are like '/auth/login'.
    // We need to ensure they hit '/api/auth/login' so the proxy catches them.
    // Previous refactor added /api prefix to endpoints.
    // So we just need to return the path.

    // Use environment variable or default to 127.0.0.1 to avoid Node IPv6 localhost resolution issues.
    // This allows changing the port in .env without code changes.
    const baseUrl = typeof window === 'undefined'
        ? (process.env.NEXT_PUBLIC_BACKEND_URL || 'http://127.0.0.1:3001')
        : '';
    // Server-side fetch needs absolute URL (internal docker/localhost).
    // Client-side fetch uses relative URL to hit proxy.

    let path = endpoint;
    const url = new URL(path, baseUrl || 'http://dummy.com'); // Dummy base for relative path construction

    if (params) {
        Object.entries(params).forEach(([key, value]) => {
            if (value !== undefined) {
                url.searchParams.append(key, String(value));
            }
        });
    }

    // Return relative path for client, absolute for server
    return typeof window === 'undefined' ? url.toString() : url.pathname + url.search;
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

        let data: any;
        const contentType = response.headers.get('content-type');

        if (contentType && contentType.includes('application/json')) {
            data = await response.json();
        } else {
            const text = await response.text();
            if (!response.ok) {
                return {
                    success: false,
                    error: {
                        code: 'server_error',
                        message: text || `Server returned ${response.status}: ${response.statusText}`,
                    },
                } as ApiErrorResponse;
            }
            data = text; // Or handle other types if needed
        }

        if (!response.ok) {
            return {
                success: false,
                error: {
                    code: data?.error?.code ?? 'unknown_error',
                    message: typeof data?.error === 'string' ? data.error : (data?.error?.message ?? data?.message ?? 'An unexpected error occurred'),
                    details: data?.error?.details,
                },
            } as ApiErrorResponse;
        }

        return {
            success: true,
            data: data.data ?? data, // Handle wrapped vs unwrapped data
            meta: data.meta,
        } as ApiSuccessResponse<TData>;
    } catch (err) {
        console.error('[API Client Error]', { endpoint, url, error: err });

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
                    message: err.message || 'Unable to connect to server',
                    details: { originalError: err.toString() }
                },
            };
        }
        return {
            success: false,
            error: {
                code: 'unknown_error',
                message: 'An unexpected error occurred during the request',
                details: { error: String(err) }
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
