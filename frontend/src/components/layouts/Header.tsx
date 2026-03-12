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

    const itemVariants = {
        hidden: (i: number) => ({
            width: 0,
            opacity: 0,
            scale: 0.8,
            rotate: -45,
            marginRight: 0,
            overflow: 'hidden',
            transition: {
                type: "spring" as const,
                stiffness: 300,
                damping: 20,
                delay: (rollingControls.length - 1 - i) * 0.05
            }
        }),
        visible: (i: number) => ({
            width: '40px',
            opacity: 1,
            scale: 1,
            rotate: 0,
            marginRight: '8px',
            transition: {
                type: "spring" as const,
                stiffness: 300,
                damping: 20,
                delay: i * 0.05
            }
        })
    };

    return (
        <div className="fixed top-4 right-4 md:right-8 z-40 flex items-center gap-2 pointer-events-none">
            <div className="flex items-center gap-2 pointer-events-auto" ref={containerRef}>
                <LiquidGlassWrapper className={cn(
                    "transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] overflow-hidden flex items-center",
                    isExpanded ? "liquidGlass-pill" : "rounded-full [&>div]:rounded-full"
                )}>
                    <div className={cn(
                        "flex items-center transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)]",
                        isExpanded ? "p-1 pl-2" : "p-0"
                    )}>
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
                                        "relative flex items-center justify-center transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] bg-transparent hover:bg-transparent text-muted-foreground shadow-none hover:shadow-none border-none group overflow-hidden",
                                        isExpanded
                                            ? "p-1 h-10 w-10 rounded-full"
                                            : "p-0 h-10 w-10 rounded-full hover:scale-105 active:scale-95"
                                    )}
                                >
                                    <div className={cn(
                                        "rounded-full bg-primary/10 overflow-hidden flex items-center justify-center text-primary border border-primary/20 transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] shrink-0",
                                        isExpanded ? "h-7 w-7" : "h-10 w-10 border-2"
                                    )}>
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
