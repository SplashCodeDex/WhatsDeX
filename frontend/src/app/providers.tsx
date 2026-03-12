'use client';

/**
 * Application Providers (Refactored for SSR Safety)
 *
 * Wraps the app with all required context providers.
 * STRICT: All providers must be active during the server-side pass
 * to ensure useContext and useEffect in child components do not fail.
 */

import { Toaster } from 'sonner';

import { ThemeProvider } from '@/components/providers/theme-provider';
import { SocketProvider } from '@/components/providers/socket-provider';
import { QueryProvider } from '@/lib/query';

import { TooltipProvider } from '@/components/ui/tooltip';

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
            <ThemeProvider defaultTheme="system" storageKey="DeXMart-theme">
                <SocketProvider>
                    <TooltipProvider>
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
                    </TooltipProvider>
                </SocketProvider>
            </ThemeProvider>
        </QueryProvider>
    );
}
