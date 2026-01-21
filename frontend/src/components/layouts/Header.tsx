'use client';

/**
 * Header Component
 *
 * Top navigation bar for the dashboard.
 * Features breadcrumbs (TODO), notifications, and user profile.
 */

import { Bell, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/features/auth';

export function Header() {
    const { user } = useAuth();

    return (
        <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-border bg-background/95 px-6 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="flex items-center gap-4">
                {/* Breadcrumbs can go here */}
                <h1 className="text-lg font-semibold md:text-xl">Dashboard</h1>
            </div>

            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" className="text-muted-foreground">
                    <Bell className="h-5 w-5" />
                    <span className="sr-only">Notifications</span>
                </Button>

                <div className="flex items-center gap-3 border-l border-border pl-4">
                    <div className="hidden flex-col items-end md:flex">
                        <span className="text-sm font-medium">{user?.name || 'User'}</span>
                        <span className="text-xs text-muted-foreground">{user?.email}</span>
                    </div>
                    <Button variant="outline" size="icon" className="rounded-full">
                        <User className="h-5 w-5" />
                    </Button>
                </div>
            </div>
        </header>
    );
}
