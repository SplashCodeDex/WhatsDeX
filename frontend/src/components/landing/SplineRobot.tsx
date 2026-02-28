import React, { Suspense } from 'react';
import Spline from '@splinetool/react-spline/next';

interface SplineRobotProps {
    sceneUrl: string;
    className?: string;
}

export function SplineRobot({ sceneUrl, className = '' }: SplineRobotProps) {
    return (
        <div className={`relative w-full h-full min-h-[400px] overflow-hidden pointer-events-auto ${className}`}>
            {/* Suspense handles the loading state natively for Async Server Components */}
            <Suspense fallback={
                <div className="absolute inset-0 flex items-center justify-center bg-background z-20 pointer-events-none">
                    <div className="flex flex-col items-center gap-4">
                        <div className="w-12 h-12 border-4 border-primary-500/30 border-t-primary-500 rounded-full animate-spin"></div>
                        <p className="text-sm text-muted-foreground animate-pulse">Initializing Studio...</p>
                    </div>
                </div>
            }>
                <Spline
                    scene={sceneUrl}
                    className="w-full h-full object-cover pointer-events-auto"
                />
            </Suspense>

            {/* Ambient Base Glow */}
            <div className="absolute bottom-[-10%] left-1/2 -translate-x-1/2 w-[80%] h-[30%] bg-primary-500/20 blur-[100px] -z-10 rounded-full pointer-events-none"></div>
        </div>
    );
}
