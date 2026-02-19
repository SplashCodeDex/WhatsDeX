'use client';

import * as React from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from '@/components/providers/theme-provider';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

export function ThemeToggle() {
    const { theme, setTheme } = useTheme();
    const [mounted, setMounted] = React.useState(false);

    React.useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) {
        return (
            <Button variant="ghost" size="icon" className="h-9 w-9" disabled>
                <div className="h-4 w-4 rounded-full border border-primary/20 animate-pulse" />
            </Button>
        );
    }

    const toggleTheme = () => {
        setTheme(theme === 'light' ? 'dark' : 'light');
    };

    return (
        <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="relative h-10 w-10 rounded-xl bg-transparent hover:bg-transparent text-muted-foreground transition-all duration-300 shadow-none hover:shadow-none border-none overflow-hidden"
            aria-label="Toggle theme"
        >
            <AnimatePresence mode="wait" initial={false}>
                {theme === 'light' ? (
                    <motion.div
                        key="sun"
                        initial={{ y: 20, opacity: 0, rotate: -45, scale: 0.5 }}
                        animate={{ y: 0, opacity: 1, rotate: 0, scale: 1 }}
                        exit={{ y: -20, opacity: 0, rotate: 45, scale: 0.5 }}
                        transition={{
                            type: "spring",
                            stiffness: 300,
                            damping: 20,
                            duration: 0.3
                        }}
                    >
                        <Sun className="h-5 w-5 text-amber-500 fill-amber-500/20" />
                    </motion.div>
                ) : (
                    <motion.div
                        key="moon"
                        initial={{ y: 20, opacity: 0, rotate: 45, scale: 0.5 }}
                        animate={{ y: 0, opacity: 1, rotate: 0, scale: 1 }}
                        exit={{ y: -20, opacity: 0, rotate: -45, scale: 0.5 }}
                        transition={{
                            type: "spring",
                            stiffness: 300,
                            damping: 20,
                            duration: 0.3
                        }}
                    >
                        <Moon className="h-5 w-5 text-blue-400 fill-blue-400/20" />
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Subtle fluent background pulse on toggle */}
            <motion.div
                key={theme === 'light' ? 'light-pulse' : 'dark-pulse'}
                initial={{ scale: 0, opacity: 0.5 }}
                animate={{ scale: 2, opacity: 0 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className={cn(
                    "absolute inset-0 rounded-full pointer-events-none",
                    theme === 'light' ? "bg-amber-400/20" : "bg-blue-400/20"
                )}
            />
        </Button>
    );
}
