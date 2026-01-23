'use client';

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
    ChevronLeft,
} from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/features/auth';
import { useUIStore } from '@/stores/useUIStore';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from '@/components/ui/sheet';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { InsightCard } from './InsightCard';

const NAV_ITEMS = [
    {
        title: 'Dashboard',
        href: '/dashboard',
        icon: LayoutDashboard,
        type: 'messages' as const,
    },
    {
        title: 'My Bots',
        href: '/dashboard/bots',
        icon: Bot,
        type: 'bots' as const,
    },
    {
        title: 'Messages',
        href: '/dashboard/messages',
        icon: MessageSquare,
        type: 'messages' as const,
    },
    {
        title: 'Contacts',
        href: '/dashboard/contacts',
        icon: Users,
        type: 'contacts' as const,
    },
    {
        title: 'Billing',
        href: '/dashboard/billing',
        icon: CreditCard,
        type: 'billing' as const,
    },
    {
        title: 'Settings',
        href: '/dashboard/settings',
        icon: Settings,
        type: 'settings' as const,
    },
];

export function Sidebar() {
    const pathname = usePathname();
    const { user, signOut } = useAuth();
    const { isSidebarCollapsed, setSidebarCollapsed } = useUIStore();

    const NavContent = (isMobile = false) => (
        <TooltipProvider delayDuration={0}>
            <div className="flex flex-1 flex-col justify-between overflow-y-auto overflow-x-hidden pt-4">
                <ul className="space-y-1 px-3">
                    {NAV_ITEMS.map((item) => {
                        const isActive = item.href === '/dashboard'
                            ? pathname === '/dashboard'
                            : pathname === item.href || pathname.startsWith(`${item.href}/`);

                        return (
                            <li key={item.href} className="relative">
                                <Tooltip open={isSidebarCollapsed && !isMobile ? undefined : false}>
                                    <TooltipTrigger asChild>
                                        <Link
                                            href={item.href}
                                            className={cn(
                                                'group relative flex h-10 items-center rounded-lg px-3 transition-all duration-150',
                                                isActive
                                                    ? 'bg-primary/10 text-primary'
                                                    : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                                            )}
                                        >
                                            <div className="flex items-center w-full">
                                                <item.icon className={cn(
                                                    'h-5 w-5 shrink-0',
                                                    isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'
                                                )} />
                                                {(!isSidebarCollapsed || isMobile) && (
                                                    <span className="ml-3 font-medium text-sm whitespace-nowrap overflow-hidden">
                                                        {item.title}
                                                    </span>
                                                )}
                                            </div>
                                        </Link>
                                    </TooltipTrigger>
                                    <TooltipContent
                                        side="right"
                                        sideOffset={20}
                                        className="p-3 bg-card border-border shadow-xl rounded-xl min-w-56"
                                    >
                                        <InsightCard type={item.type} />
                                    </TooltipContent>
                                </Tooltip>
                            </li>
                        );
                    })}
                </ul>

                <div className="mt-auto px-4 py-4 md:hidden">
                    <Button
                        variant="ghost"
                        className="w-full justify-start text-muted-foreground hover:bg-destructive/10 hover:text-destructive rounded-lg"
                        onClick={() => signOut()}
                    >
                        <LogOut className="mr-2 h-4 w-4" />
                        <span>Sign Out</span>
                    </Button>
                </div>
            </div>
        </TooltipProvider>
    );

    return (
        <>
            {/* Mobile Navigation */}
            <div className="fixed top-4 left-4 z-50 lg:hidden">
                <Sheet>
                    <SheetTrigger asChild>
                        <Button variant="outline" size="icon" className="h-10 w-10 border border-border/50 rounded-lg bg-background shadow-md hover:bg-muted">
                            <Menu className="h-5 w-5" />
                        </Button>
                    </SheetTrigger>
                    <SheetContent side="left" className="w-[85vw] max-w-80 p-0 border-r border-border bg-background shadow-2xl">
                        <SheetHeader className="p-6 pb-4 border-b border-border">
                            <SheetTitle className="text-2xl font-black text-primary">
                                WhatsDeX
                            </SheetTitle>
                        </SheetHeader>
                        {NavContent(true)}
                    </SheetContent>
                </Sheet>
            </div>

            {/* Desktop Sidebar */}
            <aside
                className={cn(
                    "fixed left-0 top-0 z-40 hidden h-screen border-r border-border bg-background transition-all duration-200 lg:block overflow-hidden shadow-lg",
                    isSidebarCollapsed ? "w-20" : "w-64"
                )}
            >
                <div className="flex h-full flex-col">
                    <div className="flex h-16 items-center justify-between px-6 border-b border-border">
                        {!isSidebarCollapsed && (
                            <span className="text-2xl font-black text-primary tracking-tight">
                                WhatsDeX
                            </span>
                        )}
                        <Button
                            variant="ghost"
                            size="icon"
                            className={cn(
                                "h-8 w-8 rounded-lg hover:bg-muted text-muted-foreground",
                                isSidebarCollapsed && "mx-auto"
                            )}
                            onClick={() => setSidebarCollapsed(!isSidebarCollapsed)}
                        >
                            <ChevronLeft className={cn(
                                "h-5 w-5 transition-transform duration-200",
                                isSidebarCollapsed && "rotate-180"
                            )} />
                        </Button>
                    </div>

                    {NavContent(false)}
                </div>
            </aside>
        </>
    );
}
