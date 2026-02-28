'use client';

import React, { useState } from 'react';
import dynamic from 'next/dynamic';

// Dynamically import Spline without SSR
const Spline = dynamic(() => import('@splinetool/react-spline'), {
    ssr: false,
});

interface SplineRobotProps {
    sceneUrl: string;
    className?: string;
}

export function SplineRobot({ sceneUrl, className = '' }: SplineRobotProps) {
    const [isLoading, setIsLoading] = useState(true);

    return (
        <div className={`relative w-full h-full min-h-[400px] overflow-hidden ${className}`}>
            {/* Loading Indicator */}
            {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-background z-20">
                    <div className="flex flex-col items-center gap-4">
                        <div className="w-12 h-12 border-4 border-primary-500/30 border-t-primary-500 rounded-full animate-spin"></div>
                        <p className="text-sm text-muted-foreground animate-pulse">Initializing R4X Core...</p>
                    </div>
                </div>
            )}

            <Spline
                scene={sceneUrl}
                className={`w-full h-full object-cover transition-opacity duration-1000 ${isLoading ? 'opacity-0' : 'opacity-100'}`}
                onLoad={() => setIsLoading(false)}
            />

            {/* Ambient Base Glow */}
            <div className="absolute bottom-[-10%] left-1/2 -translate-x-1/2 w-[80%] h-[30%] bg-primary-500/20 blur-[100px] -z-10 rounded-full pointer-events-none"></div>
        </div>
    );
}
