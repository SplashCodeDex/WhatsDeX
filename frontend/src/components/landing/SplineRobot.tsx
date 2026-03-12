'use client';

import Spline from '@splinetool/react-spline';
import type { Application } from '@splinetool/runtime';
import { useRef, useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface SplineRobotProps {
    className?: string;
    onSplineLoad?: (app: Application) => void;
    sceneUrl?: string;
}

export function SplineRobot({ 
    className, 
    onSplineLoad,
    sceneUrl = "https://prod.spline.design/ZZfs8HZoLfxM5tFG/scene.splinecode"
}: SplineRobotProps) {
    const [isLoading, setIsLoading] = useState(true);
    const splineAppRef = useRef<Application | null>(null);

    const handleLoad = (splineApp: Application) => {
        console.log("Spline: Scene Loaded Successfully");
        splineAppRef.current = splineApp;
        setIsLoading(false);
        
        if (onSplineLoad) {
            onSplineLoad(splineApp);
        }
    };

    const handleError = () => {
        setIsLoading(false);
        toast.error("Failed to load 3D assets.", {
            description: "Please check your connection or refresh the page."
        });
    };

    return (
        <div className={cn("relative overflow-hidden", className)}>
            {/* Loading Placeholder */}
            {isLoading && (
                <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/20 backdrop-blur-sm">
                    <div className="h-12 w-12 animate-spin rounded-full border-2 border-primary-500 border-t-transparent" />
                </div>
            )}
            
            <div className="h-full w-full">
                <Spline
                    scene={sceneUrl}
                    style={{ height: '100%', width: '100%' }}
                    onLoad={handleLoad}
                    onError={handleError}
                />
            </div>
        </div>
    );
}
