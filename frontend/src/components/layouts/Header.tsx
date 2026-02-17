'use client';

/**
 * Header Component
 *
 * Top navigation bar for the dashboard.
 * Features breadcrumbs (TODO), notifications, and user profile.
 */

import { Bell, User, LogOut, Settings as SettingsIcon, CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { useAuth } from '@/features/auth';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

export function Header() {
    const { user, signOut } = useAuth();
    const pathname = usePathname();

    // Map routes to human-readable titles
    const getTitle = (path: string) => {
        if (path.includes('/dashboard/omnichannel')) return 'Omnichannel Hub';
        if (path.includes('/dashboard/messages')) return 'Unified Inbox';
        if (path.includes('/dashboard/contacts')) return 'Contact Directory';
        if (path.includes('/dashboard/billing')) return 'Subscription & Billing';
        if (path.includes('/dashboard/settings')) return 'Workspace Settings';
        if (path === '/dashboard') return 'Dashboard Overview';
        return 'Dashboard';
    };

    const title = getTitle(pathname);

    return (
        <header className="sticky top-0 z-30 flex h-20 w-full items-center justify-between bg-background/50 px-8 backdrop-blur-md transition-all duration-300">
            <div className="flex items-center gap-4">
                <AnimatePresence mode="wait">
                    <motion.h1
                        key={title}
                        initial={{ opacity: 0, x: -10, filter: 'blur(10px)' }}
                        animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
                        exit={{ opacity: 0, x: 10, filter: 'blur(10px)' }}
                        transition={{ duration: 0.3, ease: "easeOut" }}
                        className="text-lg font-bold md:text-xl tracking-tight bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent"
                    >
                        {title}
                    </motion.h1>
                </AnimatePresence>
            </div>

            <div className="flex items-center gap-2">
                <ThemeToggle />

                <Button
                    variant="ghost"
                    size="icon"
                    className="h-10 w-10 rounded-xl bg-background/50 hover:bg-muted text-muted-foreground shadow-md transition-all duration-300 border border-border/50"
                >
                    <Bell className="h-5 w-5" />
                    <span className="sr-only">Notifications</span>
                </Button>

                <div className="flex items-center gap-3 border-l border-border pl-4">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="ghost"
                                className="relative flex items-center gap-3 p-1 pl-4 pr-1.5 h-10 rounded-xl bg-background/50 hover:bg-muted text-muted-foreground shadow-md transition-all duration-300 border border-border/50 group"
                            >
                                <div className="hidden flex-col items-end md:flex">
                                    <span className="text-xs font-semibold text-foreground leading-none">{user?.name || 'User'}</span>
                                    <span className="text-[9px] text-muted-foreground uppercase tracking-widest leading-none mt-1 opacity-70 group-hover:opacity-100 transition-opacity">{user?.role || 'Pro Plan'}</span>
                                </div>
                                <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center text-primary border border-primary/20 transition-transform group-hover:scale-105">
                                    <User className="h-3.5 w-3.5" />
                                </div>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56 mt-2">
                            <DropdownMenuLabel className="font-normal">
                                <div className="flex flex-col space-y-1">
                                    <p className="text-sm font-medium leading-none">{user?.name}</p>
                                    <p className="text-xs leading-none text-muted-foreground">
                                        {user?.email}
                                    </p>
                                </div>
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem asChild>
                                <Link href="/dashboard/settings" className="flex items-center">
                                    <SettingsIcon className="mr-2 h-4 w-4" />
                                    <span>Settings</span>
                                </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                                <Link href="/dashboard/billing" className="flex items-center">
                                    <CreditCard className="mr-2 h-4 w-4" />
                                    <span>Billing</span>
                                </Link>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => signOut()} className="text-error focus:text-error focus:bg-error/10">
                                <LogOut className="mr-2 h-4 w-4" />
                                <span>Sign out</span>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>
        </header>
    );
}
