'use client';

/**
 * Application Providers
 *
 * Wraps the app with all required context providers.
 * This is a Client Component because providers need client-side context.
 */

import { Toaster } from 'sonner';
import { QueryProvider } from '@/lib/query';

interface ProvidersProps {
    children: React.ReactNode;
}

/**
 * Providers wrapper component
 *
 * @example
 * // In root layout
 * <Providers>
 *   {children}
 * </Providers>
 */
export function Providers({ children }: ProvidersProps): React.JSX.Element {
    return (
        <QueryProvider>
            {/* Add other providers here as needed */}
            {/* <ThemeProvider> */}
            <Toaster
                position="top-right"
                expand={false}
                richColors
                closeButton
                theme="system"
            />
            {children}
        </QueryProvider>
    );
}
