/**
 * API Client
 *
 * Type-safe fetch wrapper for backend API calls.
 * Handles authentication, error handling, and response parsing.
 */

import { APP_CONFIG } from '@/lib/constants';
import type { ApiResponse, ApiSuccessResponse, ApiErrorResponse } from '@/types';

/**
 * HTTP methods supported by the client
 */
type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

/**
 * Request configuration
 */
interface RequestConfig<TBody = unknown> {
    method?: HttpMethod;
    body?: TBody | undefined;
    headers?: Record<string, string>;
    cache?: RequestCache;
    next?: NextFetchRequestConfig;
    signal?: AbortSignal;
}

/**
 * Next.js fetch configuration
 */
interface NextFetchRequestConfig {
    revalidate?: number | false;
    tags?: string[];
}

/**
 * API Error class for typed error handling
 */
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

/**
 * Create URL with query parameters
 */
function createUrl(
    endpoint: string,
    params?: Record<string, string | number | boolean | undefined>
): string {
    const url = new URL(endpoint, APP_CONFIG.apiUrl);

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
 * Get authorization header from session
 */
async function getAuthHeader(): Promise<string | null> {
    // In browser, get token from cookie or localStorage
    if (typeof window !== 'undefined') {
        // Client-side: we'll use the session cookie which is httpOnly
        // The cookie is automatically sent with requests
        return null;
    }

    // Server-side: read from cookies
    const { cookies } = await import('next/headers');
    const cookieStore = await cookies();
    const session = cookieStore.get('whatsdex_session');
    return session?.value ?? null;
}

/**
 * Build fetch options, handling undefined values properly
 */
function buildFetchOptions(
    method: HttpMethod,
    headers: Record<string, string>,
    body: string | null,
    cache?: RequestCache,
    next?: NextFetchRequestConfig,
    signal?: AbortSignal
): RequestInit {
    const options: RequestInit = {
        method,
        headers,
        credentials: 'include',
    };

    // Only add body if it's not null
    if (body !== null) {
        options.body = body;
    }

    // Only add cache if defined
    if (cache !== undefined) {
        options.cache = cache;
    }

    // Only add signal if defined
    if (signal !== undefined) {
        options.signal = signal;
    }

    // Add Next.js specific options
    if (next !== undefined) {
        (options as RequestInit & { next?: NextFetchRequestConfig }).next = next;
    }

    return options;
}

/**
 * Base API client function
 */
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

    if (authToken) {
        requestHeaders['Authorization'] = `Bearer ${authToken}`;
    }

    try {
        const fetchOptions = buildFetchOptions(
            method,
            requestHeaders,
            body !== undefined ? JSON.stringify(body) : null,
            cache,
            next,
            signal
        );

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
            data: data.data ?? data,
            meta: data.meta,
        } as ApiSuccessResponse<TData>;
    } catch (err) {
        // Network or parsing error
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
                    message: err.message,
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

/**
 * API client with typed methods
 */
export const api = {
    /**
     * GET request
     */
    get<TData>(
        endpoint: string,
        params?: Record<string, string | number | boolean | undefined>,
        config?: Omit<RequestConfig, 'method' | 'body'>
    ): Promise<ApiResponse<TData>> {
        const url = params ? createUrl(endpoint, params) : endpoint;
        return apiClient<TData>(url, { ...config, method: 'GET' });
    },

    /**
     * POST request
     */
    post<TData, TBody = unknown>(
        endpoint: string,
        body?: TBody,
        config?: Omit<RequestConfig<TBody>, 'method' | 'body'>
    ): Promise<ApiResponse<TData>> {
        return apiClient<TData, TBody>(endpoint, { ...config, method: 'POST', body });
    },

    /**
     * PUT request
     */
    put<TData, TBody = unknown>(
        endpoint: string,
        body?: TBody,
        config?: Omit<RequestConfig<TBody>, 'method' | 'body'>
    ): Promise<ApiResponse<TData>> {
        return apiClient<TData, TBody>(endpoint, { ...config, method: 'PUT', body });
    },

    /**
     * PATCH request
     */
    patch<TData, TBody = unknown>(
        endpoint: string,
        body?: TBody,
        config?: Omit<RequestConfig<TBody>, 'method' | 'body'>
    ): Promise<ApiResponse<TData>> {
        return apiClient<TData, TBody>(endpoint, { ...config, method: 'PATCH', body });
    },

    /**
     * DELETE request
     */
    delete<TData>(
        endpoint: string,
        config?: Omit<RequestConfig, 'method' | 'body'>
    ): Promise<ApiResponse<TData>> {
        return apiClient<TData>(endpoint, { ...config, method: 'DELETE' });
    },
};

export default api;
