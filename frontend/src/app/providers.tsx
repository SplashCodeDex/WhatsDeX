'use client';

/**
 * Application Providers (Refactored for SSR Safety)
 *
 * Wraps the app with all required context providers.
 * STRICT: All providers must be active during the server-side pass
 * to ensure useContext and useEffect in child components do not fail.
 */

import { Toaster } from 'sonner';
import { QueryProvider } from '@/lib/query';
import { ThemeProvider } from '@/components/providers/theme-provider';

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
            <ThemeProvider defaultTheme="system" storageKey="whatsdex-theme">
                <Toaster
                    position="bottom-right"
                    expand={true}
                    richColors={true}
                    closeButton
                    theme="system"
                    gap={12}
                    offset={20}
                    toastOptions={{
                        className: 'group transition-all duration-500',
                        duration: 6000,
                    }}
                />
                {children}
            </ThemeProvider>
        </QueryProvider>
    );
}
