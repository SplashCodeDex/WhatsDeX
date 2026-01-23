'use client';

import * as React from 'react';
import { Moon, Sun, Monitor } from 'lucide-react';
import { useTheme } from '@/components/providers/theme-provider';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { motion, AnimatePresence } from 'framer-motion';

export function ThemeToggle() {
    const { theme, setTheme } = useTheme();

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className="relative focus-visible:ring-offset-0 focus-visible:ring-0 active:scale-95 transition-transform"
                >
                    <AnimatePresence mode="wait" initial={false}>
                        {theme === 'light' && (
                            <motion.div
                                key="sun"
                                initial={{ opacity: 0, scale: 0.5, rotate: -90 }}
                                animate={{ opacity: 1, scale: 1, rotate: 0 }}
                                exit={{ opacity: 0, scale: 0.5, rotate: 90 }}
                                transition={{ duration: 0.2, ease: "easeOut" }}
                            >
                                <Sun className="h-[1.2rem] w-[1.2rem] text-primary" />
                            </motion.div>
                        )}
                        {theme === 'dark' && (
                            <motion.div
                                key="moon"
                                initial={{ opacity: 0, scale: 0.5, rotate: -90 }}
                                animate={{ opacity: 1, scale: 1, rotate: 0 }}
                                exit={{ opacity: 0, scale: 0.5, rotate: 90 }}
                                transition={{ duration: 0.2, ease: "easeOut" }}
                            >
                                <Moon className="h-[1.2rem] w-[1.2rem] text-primary" />
                            </motion.div>
                        )}
                        {theme === 'system' && (
                            <motion.div
                                key="monitor"
                                initial={{ opacity: 0, scale: 0.5, rotate: -90 }}
                                animate={{ opacity: 1, scale: 1, rotate: 0 }}
                                exit={{ opacity: 0, scale: 0.5, rotate: 90 }}
                                transition={{ duration: 0.2, ease: "easeOut" }}
                            >
                                <Monitor className="h-[1.2rem] w-[1.2rem] text-primary" />
                            </motion.div>
                        )}
                    </AnimatePresence>
                    <span className="sr-only">Toggle theme</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="backdrop-blur-xl bg-background/80 border-border/50">
                <DropdownMenuItem onClick={() => setTheme('light')} className="gap-2 focus:bg-primary/10">
                    <Sun className="h-4 w-4" />
                    <span>Light</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme('dark')} className="gap-2 focus:bg-primary/10">
                    <Moon className="h-4 w-4" />
                    <span>Dark</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme('system')} className="gap-2 focus:bg-primary/10">
                    <Monitor className="h-4 w-4" />
                    <span>System</span>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
