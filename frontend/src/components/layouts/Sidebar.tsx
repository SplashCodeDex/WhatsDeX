'use client';

/**
 * Sidebar Component
 *
 * Main navigation sidebar for the dashboard.
 * Features collapsible state, responsive mobile view, and navigation links.
 */

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    LayoutDashboard,
    Bot,
    MessageSquare,
    Users,
    Settings,
    CreditCard,
    LogOut,
    Menu,
    Palette,
} from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/features/auth';

const NAV_ITEMS = [
    {
        title: 'Dashboard',
        href: '/dashboard',
        icon: LayoutDashboard,
    },
    {
        title: 'My Bots',
        href: '/dashboard/bots',
        icon: Bot,
    },
    {
        title: 'Messages',
        href: '/dashboard/messages',
        icon: MessageSquare,
    },
    {
        title: 'Contacts',
        href: '/dashboard/contacts',
        icon: Users,
    },
    {
        title: 'Billing',
        href: '/dashboard/billing',
        icon: CreditCard,
    },
    {
        title: 'Assets',
        href: '/dashboard/assets',
        icon: Palette,
    },
    {
        title: 'Settings',
        href: '/dashboard/settings',
        icon: Settings,
    },
];

export function Sidebar() {
    const pathname = usePathname();
    const { signOut } = useAuth();

    return (
        <>
            {/* Mobile Menu Button - TODO: Implement Sheet/Drawer for mobile */}
            <div className="fixed top-4 left-4 z-50 md:hidden">
                <Button variant="outline" size="icon">
                    <Menu className="h-4 w-4" />
                </Button>
            </div>

            {/* Desktop Sidebar */}
            <aside className="fixed left-0 top-0 z-40 hidden h-screen w-64 border-r border-border bg-card transition-transform md:translate-x-0 lg:block">
                <div className="flex h-full flex-col px-3 py-4">
                    <div className="mb-5 flex items-center pl-2.5">
                        <span className="self-center whitespace-nowrap text-xl font-semibold dark:text-white">
                            WhatsDeX
                        </span>
                    </div>

                    <div className="flex flex-1 flex-col justify-between overflow-y-auto">
                        <ul className="space-y-2 font-medium">
                            {NAV_ITEMS.map((item) => {
                                const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
                                return (
                                    <li key={item.href}>
                                        <Link
                                            href={item.href}
                                            className={cn(
                                                'flex items-center rounded-lg p-2 text-foreground hover:bg-muted group',
                                                isActive && 'bg-primary/10 text-primary hover:bg-primary/20'
                                            )}
                                        >
                                            <item.icon className={cn(
                                                'h-5 w-5 transition duration-75 group-hover:text-foreground',
                                                isActive ? 'text-primary' : 'text-muted-foreground'
                                            )} />
                                            <span className="ml-3">{item.title}</span>
                                        </Link>
                                    </li>
                                );
                            })}
                        </ul>

                        <div className="border-t border-border pt-4">
                            <Button
                                variant="ghost"
                                className="w-full justify-start text-muted-foreground hover:text-destructive"
                                onClick={() => signOut()}
                            >
                                <LogOut className="mr-2 h-4 w-4" />
                                Sign Out
                            </Button>
                        </div>
                    </div>
                </div>
            </aside>
        </>
    );
}
