'use client';

/**
 * Header Component
 *
 * Top navigation bar for the dashboard.
 * Features a dynamic, animated pill that rolls in controls on interaction.
 */

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, User, LogOut, Settings as SettingsIcon, CreditCard } from 'lucide-react';
import Link from 'next/link';
import { BOUNCY_SPRING, BOUNCY_BEZIER_STRING, createRollingVariants } from '@/lib/animations';


import { LiquidGlassWrapper } from '@/components/effects/LiquidGlassWrapper';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { useAuth } from '@/features/auth';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';


export function Header() {
    const { user, signOut, isLoading } = useAuth();
    const [isExpanded, setIsExpanded] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    // Collapse on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsExpanded(false);
            }
        };

        if (isExpanded) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isExpanded]);


    const rollingControls = [
        { key: 'theme', label: 'Theme', component: <ThemeToggle /> },
        {
            key: 'notifications',
            label: 'Notifications',
            component: (
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-10 w-10 rounded-xl bg-transparent hover:bg-transparent text-muted-foreground transition-all duration-300 shadow-none hover:shadow-none border-none"
                >
                    <Bell className="h-5 w-5" />
                </Button>
            )
        },
        {
            key: 'settings',
            label: 'Settings',
            component: (
                <Link href="/dashboard/settings">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-10 w-10 rounded-xl bg-transparent hover:bg-transparent text-muted-foreground transition-all duration-300 shadow-none hover:shadow-none border-none"
                    >
                        <SettingsIcon className="h-5 w-5" />
                    </Button>
                </Link>
            )
        },
        {
            key: 'billing',
            label: 'Billing',
            component: (
                <Link href="/dashboard/billing">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-10 w-10 rounded-xl bg-transparent hover:bg-transparent text-muted-foreground transition-all duration-300 shadow-none hover:shadow-none border-none"
                    >
                        <CreditCard className="h-5 w-5" />
                    </Button>
                </Link>
            )
        },
        {
            key: 'logout',
            label: 'Sign out',
            component: (
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => signOut()}
                    className="h-10 w-10 rounded-xl bg-transparent hover:bg-transparent text-error hover:text-error/80 transition-all duration-300 shadow-none hover:shadow-none border-none"
                >
                    <LogOut className="h-5 w-5" />
                </Button>
            )
        }
    ];

    const itemVariants = createRollingVariants(rollingControls.length);


    return (
        <div className="fixed top-4 right-4 md:right-8 z-40 flex items-center gap-2 pointer-events-none">
            <div className="flex items-center gap-2 pointer-events-auto" ref={containerRef}>
                <LiquidGlassWrapper className={cn(
                    "transition-all duration-500 overflow-hidden flex items-center",
                    isExpanded ? "liquidGlass-pill" : "rounded-full [&>div]:rounded-full"
                )} style={{ transitionTimingFunction: BOUNCY_BEZIER_STRING }}>
                    <div className={cn(
                        "flex items-center transition-all duration-500",
                        isExpanded ? "p-1 pl-2" : "p-0"
                    )} style={{ transitionTimingFunction: BOUNCY_BEZIER_STRING }}>

                        <AnimatePresence>
                            {isExpanded && (
                                rollingControls.map((control, idx) => (
                                    <motion.div
                                        key={control.key}
                                        custom={idx}
                                        variants={itemVariants}
                                        initial="hidden"
                                        animate="visible"
                                        exit="hidden"
                                    >
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <div className="flex items-center justify-center">
                                                    {control.component}
                                                </div>
                                            </TooltipTrigger>
                                            <TooltipContent className="rounded-xl font-semibold">
                                                {control.label}
                                            </TooltipContent>
                                        </Tooltip>
                                    </motion.div>
                                ))
                            )}
                        </AnimatePresence>

                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    variant="ghost"
                                    onClick={() => setIsExpanded(!isExpanded)}
                                    className={cn(
                                        "relative flex items-center justify-center transition-all duration-500 bg-transparent hover:bg-transparent text-muted-foreground shadow-none hover:shadow-none border-none group overflow-hidden",
                                        isExpanded
                                            ? "p-1 h-10 w-10 rounded-full"
                                            : "p-0 h-10 w-10 rounded-full hover:scale-105 active:scale-95"
                                    )}
                                    style={{ transitionTimingFunction: BOUNCY_BEZIER_STRING }}
                                >
                                    <div className={cn(
                                        "rounded-full bg-primary/10 overflow-hidden flex items-center justify-center text-primary border border-primary/20 transition-all duration-500 shrink-0",
                                        isExpanded ? "h-7 w-7" : "h-10 w-10 border-2"
                                    )} style={{ transitionTimingFunction: BOUNCY_BEZIER_STRING }}>

                                        {user?.photoURL ? (
                                            <img
                                                src={user.photoURL}
                                                alt={user.name || "User avatar"}
                                                className={cn(
                                                    "h-full w-full object-cover transition-transform duration-500",
                                                    !isExpanded && "scale-110"
                                                )}
                                                referrerPolicy="no-referrer"
                                            />
                                        ) : (
                                            <User className={cn("transition-all duration-500", isExpanded ? "h-3.5 w-3.5" : "h-5 w-5")} />
                                        )}
                                    </div>
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent side="left" className="rounded-xl font-semibold">
                                {isExpanded ? "Close" : user?.name || "Profile"}
                            </TooltipContent>
                        </Tooltip>
                    </div>
                </LiquidGlassWrapper>
            </div>
        </div>
    );
}
