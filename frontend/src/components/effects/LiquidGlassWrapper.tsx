'use client';

import { cn } from '@/lib/utils';

/**
 * LiquidGlassWrapper
 *
 * A reusable wrapper that applies the liquid glass effect layers
 * around any child content. Uses the CSS classes from liquid-glass.css
 * and references the SVG filter from LiquidGlassFilters.tsx.
 */
export function LiquidGlassWrapper({
    children,
    className,
}: {
    children: React.ReactNode;
    className?: string;
}) {
    return (
        <div className={cn('liquidGlass-wrapper', className)}>
            <div className="liquidGlass-effect" />
            <div className="liquidGlass-tint" />
            <div className="liquidGlass-shine" />
            <div className="liquidGlass-content">
                {children}
            </div>
        </div>
    );
}
