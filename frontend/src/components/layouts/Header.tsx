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
import Link from 'next/link';

export function Header() {
    const { user, signOut } = useAuth();

    return (
        <header className="sticky top-0 z-30 flex h-20 w-full items-center justify-between bg-background/50 px-8 backdrop-blur-md transition-all duration-300">
            <div className="flex items-center gap-4">
                <h1 className="text-lg font-semibold md:text-xl">Dashboard</h1>
            </div>

            <div className="flex items-center gap-2">
                <ThemeToggle />

                <Button variant="ghost" size="icon" className="text-muted-foreground">
                    <Bell className="h-5 w-5" />
                    <span className="sr-only">Notifications</span>
                </Button>

                <div className="flex items-center gap-3 border-l border-border pl-4">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="relative flex items-center gap-3 p-1 hover:bg-muted/50 rounded-lg pr-3">
                                <div className="hidden flex-col items-end md:flex">
                                    <span className="text-sm font-medium">{user?.name || 'User'}</span>
                                    <span className="text-[10px] text-muted-foreground uppercase tracking-widest leading-none mt-1">{user?.role || 'Pro Plan'}</span>
                                </div>
                                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
                                    <User className="h-4 w-4" />
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
