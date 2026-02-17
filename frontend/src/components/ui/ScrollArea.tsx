'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface ScrollAreaProps extends React.HTMLAttributes<HTMLDivElement> {
    children: React.ReactNode;
    showFades?: boolean;
    viewportClassName?: string;
}

export function ScrollArea({
    children,
    className,
    viewportClassName,
    showFades = true,
    ...props
}: ScrollAreaProps) {
    const scrollRef = React.useRef<HTMLDivElement>(null);
    const [scrollState, setScrollState] = React.useState({
        isAtTop: true,
        isAtBottom: false,
        hasScroll: false,
    });

    const checkScroll = React.useCallback(() => {
        const element = scrollRef.current;
        if (element) {
            const { scrollTop, scrollHeight, clientHeight } = element;
            const hasScroll = scrollHeight > clientHeight;
            const isAtTop = scrollTop <= 4;
            const isAtBottom = Math.abs(scrollHeight - clientHeight - scrollTop) <= 4;

            setScrollState({ isAtTop, isAtBottom, hasScroll });
        }
    }, []);

    React.useEffect(() => {
        const element = scrollRef.current;
        if (element) {
            checkScroll();
            window.addEventListener('resize', checkScroll);
            return () => window.removeEventListener('resize', checkScroll);
        }
        return undefined;
    }, [checkScroll, children]);

    return (
        <div className={cn("relative flex-1 flex flex-col min-h-0 overflow-hidden", className)} {...props}>
            <div
                ref={scrollRef}
                onScroll={checkScroll}
                className={cn("flex-1 overflow-y-auto overflow-x-hidden no-scrollbar flex flex-col", viewportClassName)}
                style={{
                    maskImage: showFades && scrollState.hasScroll ? `
                        linear-gradient(to bottom,
                            transparent 0%,
                            black ${scrollState.isAtTop ? '0%' : '8%'},
                            black ${scrollState.isAtBottom ? '100%' : '92%'},
                            transparent 100%
                        )
                    ` : 'none',
                    WebkitMaskImage: showFades && scrollState.hasScroll ? `
                        linear-gradient(to bottom,
                            transparent 0%,
                            black ${scrollState.isAtTop ? '0%' : '8%'},
                            black ${scrollState.isAtBottom ? '100%' : '92%'},
                            transparent 100%
                        )
                    ` : 'none',
                    transition: 'mask-image 0.3s ease, -webkit-mask-image 0.3s ease'
                }}
            >
                {children}
            </div>
        </div>
    );
}
