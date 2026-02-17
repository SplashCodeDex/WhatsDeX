'use client';

import React, { useEffect, useState } from 'react';
import { ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

export function ScrollToTop() {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const toggleVisibility = () => {
            // Show when page is scrolled down more than 400px
            if (typeof window !== 'undefined' && window.scrollY > 400) {
                setIsVisible(true);
            } else {
                setIsVisible(false);
            }
        };

        window.addEventListener('scroll', toggleVisibility);
        return () => window.removeEventListener('scroll', toggleVisibility);
    }, []);

    const scrollToTop = () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth',
        });
    };

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.8, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.8, y: 20 }}
                    transition={{
                        type: 'spring',
                        stiffness: 260,
                        damping: 20,
                    }}
                    className="fixed bottom-8 right-8 z-50"
                >
                    <Button
                        onClick={scrollToTop}
                        size="icon"
                        className={cn(
                            "h-12 w-12 rounded-xl shadow-2xl",
                            "bg-gradient-to-br from-accent to-primary",
                            "text-primary-foreground",
                            "hover:scale-110 active:scale-95 transition-transform",
                            "border border-white/20 backdrop-blur-sm",
                            "group relative overflow-hidden"
                        )}
                        aria-label="Scroll to top"
                    >
                        {/* Glow Effect */}
                        <div className="absolute inset-0 bg-primary/20 blur-xl group-hover:bg-primary/40 transition-colors" />

                        <ChevronUp className="h-6 w-6 relative z-10 animate-bounce group-hover:animate-none" />

                        {/* Subtle Pulse */}
                        <span className="absolute inset-0 rounded-xl animate-ping bg-primary/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </Button>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
