'use client';

import { useEffect } from 'react';
import { logger } from '@/lib/logger';

import { Button } from '@/components/ui/button';

interface ErrorProps {
    error: Error & { digest?: string };
    reset: () => void;
}

export default function Error({ error, reset }: ErrorProps): React.JSX.Element {
    useEffect(() => {
        // Log the error to an error reporting service
        logger.error('Application error:', { error: error });
    }, [error]);

    return (
        <div className="flex min-h-screen flex-col items-center justify-center px-4">
            <div className="text-center">
                <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-full bg-error/10 text-error">
                    <svg
                        className="h-8 w-8"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                        />
                    </svg>
                </div>
                <h1 className="mb-4 text-2xl font-bold text-foreground">
                    Something went wrong
                </h1>
                <p className="mb-8 max-w-md text-muted-foreground">
                    We encountered an unexpected error. Please try again, or contact
                    support if the problem persists.
                </p>
                <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
                    <Button onClick={reset}>Try Again</Button>
                    <Button variant="outline" asChild>
                        <a href="/">Go Home</a>
                    </Button>
                </div>
                {error.digest && (
                    <p className="mt-8 text-xs text-muted-foreground">
                        Error ID: {error.digest}
                    </p>
                )}
            </div>
        </div>
    );
}
