'use client';

/**
 * React Query Provider
 *
 * Configures TanStack Query for client-side data fetching and caching.
 * Wrap the app with this provider for query functionality.
 */

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

interface QueryProviderProps {
    children: React.ReactNode;
}

/**
 * Create a query client with sensible defaults
 */
function makeQueryClient(): QueryClient {
    return new QueryClient({
        defaultOptions: {
            queries: {
                // Data is considered fresh for 1 minute
                staleTime: 60 * 1000,
                // Keep unused data in cache for 5 minutes
                gcTime: 5 * 60 * 1000,
                // Retry failed queries 2 times
                retry: 2,
                // Don't retry on 4xx errors
                retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
                // Refetch on window focus (good for real-time data)
                refetchOnWindowFocus: true,
            },
            mutations: {
                // Retry mutations once
                retry: 1,
            },
        },
    });
}

// Singleton for SSR - prevents creating multiple clients
let browserQueryClient: QueryClient | undefined;

function getQueryClient(): QueryClient {
    if (typeof window === 'undefined') {
        // Server: always create a new client
        return makeQueryClient();
    }

    // Browser: reuse client across renders
    if (!browserQueryClient) {
        browserQueryClient = makeQueryClient();
    }
    return browserQueryClient;
}

/**
 * Query Provider Component
 */
export function QueryProvider({ children }: QueryProviderProps): React.JSX.Element {
    const queryClient = getQueryClient();

    return (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
}
