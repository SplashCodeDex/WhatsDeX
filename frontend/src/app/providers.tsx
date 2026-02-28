'use client';

/**
 * Application Providers
 *
 * Wraps the app with all required context providers.
 * This is a Client Component because providers need client-side context.
 */

import { Toaster } from 'sonner';
import { QueryProvider } from '@/lib/query';
import { ThemeProvider } from '@/components/providers/theme-provider';

interface ProvidersProps {
    children: React.ReactNode;
}

/**
 * Providers wrapper component
 */
export function Providers({ children }: ProvidersProps): React.JSX.Element {
    return (
        <QueryProvider>
            <ThemeProvider defaultTheme="system" storageKey="whatsdex-theme">
                <Toaster
                    position="top-right"
                    expand={false}
                    richColors={false}
                    closeButton
                    theme="system"
                    toastOptions={{
                        className: 'group hover:scale-[1.02] transition-transform active:scale-[0.98]',
                        duration: 4000,
                    }}
                />
                {children}
            </ThemeProvider>
        </QueryProvider>
    );
}
