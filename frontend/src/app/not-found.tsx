'use client';

import { useState, useEffect } from 'react';

export default function NotFound(): React.JSX.Element {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) {
        return <div className="min-h-screen bg-background" />;
    }

    return (
        <div className="flex min-h-screen flex-col items-center justify-center px-4">
            <div className="text-center">
                <h1 className="mb-4 text-6xl font-bold text-foreground">404</h1>
                <h2 className="mb-4 text-2xl font-semibold text-foreground">
                    Page Not Found
                </h2>
                <p className="mb-8 text-muted-foreground">
                    The page you&apos;re looking for doesn&apos;t exist or has been moved.
                </p>
                <a
                    href="/"
                    style={{
                        display: 'inline-flex',
                        height: '2.5rem',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: '0.5rem',
                        backgroundColor: '#000',
                        color: '#fff',
                        padding: '0 1rem',
                        fontSize: '0.875rem',
                        fontWeight: '500',
                        textDecoration: 'none'
                    }}
                >
                    Go Home
                </a>
            </div>
        </div>
    );
}
