'use client';

import { Suspense, Component, useState, useCallback, useEffect } from 'react';
import type { Application } from '@splinetool/runtime';
import type { ReactNode, ErrorInfo } from 'react';
import Spline from '@splinetool/react-spline';

// ── Error Boundary ──────────────────────────────────────────────────────
// Catches Spline runtime errors (e.g. "Cannot read 'position' of undefined")
// and renders a graceful fallback instead of crashing the entire page.

interface ErrorBoundaryProps {
    fallback: ReactNode;
    children: ReactNode;
}

interface ErrorBoundaryState {
    hasError: boolean;
}

class SplineErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
    constructor(props: ErrorBoundaryProps) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(): ErrorBoundaryState {
        return { hasError: true };
    }

    componentDidCatch(error: Error, info: ErrorInfo): void {
        console.warn('[SplineRobot] Runtime error caught by boundary:', error.message, info.componentStack);
    }

    render() {
        if (this.state.hasError) {
            return this.props.fallback;
        }
        return this.props.children;
    }
}

// ── SplineRobot Component ───────────────────────────────────────────────

interface SplineRobotProps {
    sceneUrl: string;
    className?: string;
}

export function SplineRobot({ sceneUrl, className = '' }: SplineRobotProps) {
    const [hasError, setHasError] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    // Catch Spline runtime errors that fire outside React's lifecycle
    // (e.g. "Cannot read properties of undefined (reading 'position')" in onFrame)
    useEffect(() => {
        const handler = (event: ErrorEvent) => {
            if (event.filename?.includes('@splinetool') || event.message?.includes('position')) {
                console.warn('[SplineRobot] Suppressed Spline runtime error:', event.message);
                event.preventDefault(); // Suppress red overlay
                setHasError(true);
            }
        };
        window.addEventListener('error', handler);
        return () => window.removeEventListener('error', handler);
    }, []);

    const handleLoad = useCallback((splineApp: Application) => {
        // Spline wrapper mounted, now manually load the scene safely.
        // This prevents the autostart `onFrame` crash.
        splineApp.load(sceneUrl)
            .then(() => {
                console.log('[SplineRobot] Scene loaded successfully via manual load');
                setIsLoading(false);
            })
            .catch((err) => {
                console.error('[SplineRobot] Failed to manual load scene:', err);
                setHasError(true);
                setIsLoading(false);
            });
    }, [sceneUrl]);

    const handleError = useCallback(() => {
        console.warn('[SplineRobot] Failed to initialize Spline wrapper, showing fallback');
        setHasError(true);
        setIsLoading(false);
    }, []);

    const fallbackUI = (
        <div className="flex h-full w-full items-center justify-center bg-background">
            <div className="flex flex-col items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-primary-500/10 flex items-center justify-center">
                    <svg className="w-8 h-8 text-primary-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 7.5l-2.25-1.313M21 7.5v2.25m0-2.25l-2.25 1.313M3 7.5l2.25-1.313M3 7.5l2.25 1.313M3 7.5v2.25m9 3l2.25-1.313M12 12.75l-2.25-1.313M12 12.75V15m0 6.75l2.25-1.313M12 21.75V19.5m0 2.25l-2.25-1.313m0-16.875L12 2.25l2.25 1.313M21 14.25v2.25l-2.25 1.313m-13.5 0L3 16.5v-2.25" />
                    </svg>
                </div>
                <p className="text-sm text-muted-foreground">3D scene unavailable</p>
            </div>
        </div>
    );

    if (hasError) {
        return <div className={className}>{fallbackUI}</div>;
    }

    return (
        <div className={className}>
            <SplineErrorBoundary fallback={fallbackUI}>
                <div className="relative w-full h-full">
                    {/* Show loader while manual load is happening */}
                    {isLoading && (
                        <div className="absolute inset-0 flex items-center justify-center bg-background z-10 pointer-events-none">
                            <div className="flex flex-col items-center gap-4">
                                <div className="w-12 h-12 border-4 border-primary-500/30 border-t-primary-500 rounded-full animate-spin"></div>
                                <p className="text-sm text-muted-foreground animate-pulse">Initializing Studio...</p>
                            </div>
                        </div>
                    )}
                    <Suspense fallback={null}>
                        {/* Only initialize the app, DO NOT pass scene prop directly to avoid onFrame undefined crash */}
                        <Spline
                            scene=""
                            onLoad={handleLoad}
                            onError={handleError}
                        />
                    </Suspense>
                </div>
            </SplineErrorBoundary>

            {/* Ambient Base Glow */}
            <div className="absolute bottom-[-10%] left-1/2 -translate-x-1/2 w-[80%] h-[30%] bg-primary-500/20 blur-[100px] -z-10 rounded-full pointer-events-none"></div>
        </div>
    );
}
