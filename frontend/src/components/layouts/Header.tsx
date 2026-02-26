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
import { LiquidGlassWrapper } from '@/components/effects/LiquidGlassWrapper';
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
    const { user, signOut, isLoading } = useAuth();

    return (
        <div className="fixed top-4 right-4 md:right-8 z-40 flex items-center gap-2 pointer-events-none">
            <div className="flex items-center gap-2 pointer-events-auto">
                <LiquidGlassWrapper className="liquidGlass-control">
                    <ThemeToggle />
                </LiquidGlassWrapper>

                <LiquidGlassWrapper className="liquidGlass-control">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-10 w-10 rounded-xl bg-transparent hover:bg-transparent text-muted-foreground transition-all duration-300 shadow-none hover:shadow-none border-none"
                    >
                        <Bell className="h-5 w-5" />
                        <span className="sr-only">Notifications</span>
                    </Button>
                </LiquidGlassWrapper>

                <LiquidGlassWrapper className="liquidGlass-pill">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="ghost"
                                className="relative flex items-center gap-3 p-1 pl-4 pr-1.5 h-10 rounded-2xl bg-transparent hover:bg-transparent text-muted-foreground transition-all duration-300 shadow-none hover:shadow-none border-none group"
                            >
                                <div className="hidden flex-col items-end md:flex">
                                    {isLoading ? (
                                        <div className="flex flex-col items-end gap-1">
                                            <div className="h-3 w-20 bg-muted/20 animate-pulse rounded" />
                                            <div className="h-2 w-12 bg-muted/10 animate-pulse rounded" />
                                        </div>
                                    ) : (
                                        <>
                                            <span className="text-xs font-semibold text-foreground leading-none">{user?.name}</span>
                                            <span className="text-[9px] text-muted-foreground uppercase tracking-widest leading-none mt-1 opacity-70 group-hover:opacity-100 transition-opacity">{user?.role}</span>
                                        </>
                                    )}
                                </div>
                                <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center text-primary border border-primary/20 transition-transform group-hover:scale-105">
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
                </LiquidGlassWrapper>
            </div>
        </div>
    );
}
