'use client';

import { Suspense, Component, useState, useCallback, useEffect } from 'react';
import type { ReactNode, ErrorInfo } from 'react';
import Image from 'next/image';
import Spline from '@splinetool/react-spline';

// ── Error Boundary ──────────────────────────────────────────────────────
class SplineErrorBoundary extends Component<{ fallback: ReactNode; children: ReactNode }, { hasError: boolean }> {
    constructor(props: { fallback: ReactNode; children: ReactNode }) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(): { hasError: boolean } {
        return { hasError: true };
    }

    componentDidCatch(error: Error, info: ErrorInfo): void {
        console.warn('[SplineRobot] Runtime error caught by boundary:', error.message);
    }

    render() {
        if (this.state.hasError) return this.props.fallback;
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
    const [isMounted, setIsMounted] = useState(false);

    // Ensure we only render on the client
    useEffect(() => {
        setIsMounted(true);
    }, []);

    const handleLoad = useCallback(() => {
        console.log('[SplineRobot] Scene loaded');
        setIsLoading(false);
    }, []);

    const handleError = useCallback(() => {
        console.warn('[SplineRobot] Spline failed to initialize');
        setHasError(true);
        setIsLoading(false);
    }, []);

    const fallbackUI = (
        <div className="flex h-full w-full items-center justify-center bg-background">
            <div className="flex flex-col items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-primary-500/10 flex items-center justify-center text-primary-500">
                    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 7.5l-2.25-1.313M21 7.5v2.25m0-2.25l-2.25 1.313M3 7.5l2.25-1.313M3 7.5l2.25 1.313M3 7.5v2.25m9 3l2.25-1.313M12 12.75l-2.25-1.313M12 12.75V15m0 6.75l2.25-1.313M12 21.75V19.5m0 2.25l-2.25-1.313m0-16.875L12 2.25l2.25 1.313M21 14.25v2.25l-2.25 1.313m-13.5 0L3 16.5v-2.25" />
                    </svg>
                </div>
                <p className="text-sm text-muted-foreground">3D scene unavailable</p>
            </div>
        </div>
    );

    if (!isMounted) return <div className={className} />;
    if (hasError) return <div className={className}>{fallbackUI}</div>;

    return (
        <div className={className}>
            <SplineErrorBoundary fallback={fallbackUI}>
                <div className="relative w-full h-full overflow-hidden">
                    {/* Visual Placeholder for instant feedback */}
                    {isLoading && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-background z-10 transition-opacity duration-1000">
                            {/* Robot Placeholder Image */}
                            <div className="relative w-full h-full flex items-center justify-center">
                                <Image
                                    src="/assets/illustrations/bot-automation.png"
                                    alt="DeXMart Assistant Loading..."
                                    fill
                                    className="object-contain opacity-20 scale-90 blur-sm animate-pulse"
                                    priority
                                />

                                {/* Loading Indicator Overlay */}
                                <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-b from-transparent via-background/40 to-background">
                                    <div className="flex flex-col items-center gap-6">
                                        <div className="relative">
                                            <div className="w-16 h-16 border-4 border-primary-500/20 border-t-primary-500 rounded-full animate-spin"></div>
                                            <div className="absolute inset-0 w-16 h-16 bg-primary-500/10 blur-xl rounded-full animate-pulse"></div>
                                        </div>
                                        <div className="space-y-1 text-center">
                                            <p className="text-sm font-bold tracking-widest text-primary-500 uppercase animate-pulse">
                                                Initializing Neural Link
                                            </p>
                                            <p className="text-[10px] text-muted-foreground uppercase tracking-tighter">
                                                Loading 3D Studio Engine...
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                    <Suspense fallback={null}>
                        <Spline
                            key={sceneUrl}
                            scene={sceneUrl}
                            onLoad={handleLoad}
                            onError={handleError}
                            style={{ width: '100%', height: '100%' }}
                        />
                    </Suspense>
                </div>
            </SplineErrorBoundary>

            {/* Ambient Base Glow */}
            <div className="absolute bottom-[-10%] left-1/2 -translate-x-1/2 w-[80%] h-[30%] bg-primary-500/20 blur-[100px] -z-10 rounded-full pointer-events-none"></div>
        </div>
    );
}
