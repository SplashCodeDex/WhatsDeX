'use client';

import { useEffect } from 'react';
import { logger } from '@/lib/logger';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';

interface ErrorProps {
    error: Error & { digest?: string };
    reset: () => void;
}

/**
 * Root Error Boundary
 * 
 * Optimized for SSR/Hydration. Removed temporary mounted guard.
 */
export default function Error({ error, reset }: ErrorProps): React.JSX.Element {
    useEffect(() => {
        logger.error('Application error:', { error });
    }, [error]);

    return (
        <div className="flex min-h-screen flex-col items-center justify-center px-4 bg-background">
            <div className="text-center max-w-md">
                <div className="mb-6 inline-flex h-20 w-20 items-center justify-center rounded-full bg-destructive/10 text-destructive animate-in zoom-in duration-300">
                    <AlertTriangle className="h-10 w-10" />
                </div>
                <h1 className="mb-4 text-3xl font-bold tracking-tight text-foreground">
                    Something went wrong
                </h1>
                <p className="mb-8 text-muted-foreground text-balance">
                    We encountered an unexpected error. Our systems have been notified and we are working on a fix.
                </p>
                <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
                    <Button onClick={reset} size="lg" className="min-w-[140px] font-bold">
                        Try Again
                    </Button>
                    <Button variant="outline" size="lg" className="min-w-[140px] font-bold" asChild>
                        <a href="/dashboard">Return Home</a>
                    </Button>
                </div>
                {error.digest && (
                    <p className="mt-12 text-[10px] font-mono text-muted-foreground uppercase tracking-widest opacity-50">
                        Error ID: {error.digest}
                    </p>
                )}
            </div>
        </div>
    );
}
