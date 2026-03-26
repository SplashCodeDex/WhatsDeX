'use client';

import { useEffect, useRef, useState } from 'react';

import { cn } from '@/lib/utils';

interface SplineRobotProps {
    className?: string;
    sceneUrl?: string;
}

export function SplineRobot({
    className,
    sceneUrl = "https://prod.spline.design/ZZfs8HZoLfxM5tFG/scene.splinecode"
}: SplineRobotProps) {
    const [isLoading, setIsLoading] = useState(true);
    const viewerRef = useRef<HTMLElement>(null);

    // Dynamically import the viewer to register the web component (client-side only)
    useEffect(() => {
        import('@splinetool/viewer');
    }, []);

    // Listen for the spline-viewer 'load-complete' event to dismiss the spinner
    useEffect(() => {
        const viewer = viewerRef.current;
        if (!viewer) return;

        const onLoadComplete = () => {
            console.log("Spline Viewer: Scene Loaded Successfully");
            setIsLoading(false);
        };

        viewer.addEventListener('load-complete', onLoadComplete);
        return () => viewer.removeEventListener('load-complete', onLoadComplete);
    }, []);

    return (
        <div className={cn("relative overflow-hidden", className)}>
            {/* Loading Placeholder */}
            {isLoading ? <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/20 backdrop-blur-sm">
                    <div className="h-12 w-12 animate-spin rounded-full border-2 border-primary-500 border-t-transparent" />
                </div> : null}

            {/* 
                Spline Viewer Web Component
                - events-target="global" → cursor tracking works across the ENTIRE page
                - loading="lazy" → fixes the race condition where onFrame fires before
                  scene objects (camera, Look At targets) are fully initialized.
                  Without this, the viewer crashes with:
                  TypeError: Cannot read properties of undefined (reading 'position')
                
                If the TypeError persists even with loading="lazy", the root cause is
                in the Spline scene itself — the Look At / Follow events may target
                an object or camera that isn't properly configured as primary viewport.
            */}
            {/* @ts-expect-error spline-viewer is a custom HTML element, not a React component */}
            <spline-viewer
                ref={viewerRef}
                url={sceneUrl}
                events-target="global"
                loading="lazy"
                style={{ height: '100%', width: '100%' }}
            />
        </div>
    );
}
