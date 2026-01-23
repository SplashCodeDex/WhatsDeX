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
import { motion, AnimatePresence } from 'framer-motion';

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
                <ul className="space-y-1.5 px-3">
                    {NAV_ITEMS.map((item) => {
                        // Logic fix: Exact match for dashboard, start-with for others
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
                                                'group relative flex h-10 items-center rounded-xl px-3 transition-colors duration-200',
                                                isActive
                                                    ? 'text-primary'
                                                    : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                                            )}
                                        >
                                            {isActive && (
                                                <motion.div
                                                    layoutId="active-nav-bg"
                                                    className="absolute inset-0 z-0 bg-primary/10 rounded-xl"
                                                    initial={false}
                                                    transition={{
                                                        type: 'spring',
                                                        stiffness: 300,
                                                        damping: 30,
                                                    }}
                                                />
                                            )}
                                            <div className="z-10 flex items-center w-full">
                                                <item.icon className={cn(
                                                    'h-5 w-5 shrink-0 transition-colors',
                                                    isActive ? 'text-primary shadow-[0_0_10px_rgba(var(--color-primary-500),0.1)]' : 'text-muted-foreground group-hover:text-foreground'
                                                )} />
                                                <AnimatePresence mode="wait">
                                                    {(!isSidebarCollapsed || isMobile) && (
                                                        <motion.span
                                                            initial={{ opacity: 0, x: -5 }}
                                                            animate={{ opacity: 1, x: 0 }}
                                                            exit={{ opacity: 0, x: -5 }}
                                                            transition={{ duration: 0.15 }}
                                                            className="ml-3 font-medium text-sm whitespace-nowrap overflow-hidden"
                                                        >
                                                            {item.title}
                                                        </motion.span>
                                                    )}
                                                </AnimatePresence>
                                            </div>
                                        </Link>
                                    </TooltipTrigger>
                                    <TooltipContent
                                        side="right"
                                        sideOffset={20}
                                        className="p-3 bg-background/80 backdrop-blur-2xl border-border/50 shadow-2xl rounded-2xl min-w-56"
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
                        className="w-full justify-start text-muted-foreground hover:bg-destructive/10 hover:text-destructive rounded-xl"
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
                        <Button variant="outline" size="icon" className="h-10 w-10 border border-border/50 rounded-xl bg-background/50 backdrop-blur-md shadow-lg shadow-black/5 hover:bg-background/80">
                            <Menu className="h-5 w-5" />
                        </Button>
                    </SheetTrigger>
                    <SheetContent side="left" className="w-[85vw] max-w-80 p-0 border-r border-border/50 bg-background/80 backdrop-blur-3xl shadow-2xl">
                        <SheetHeader className="p-6 pb-4 border-b border-border/50">
                            <SheetTitle className="text-2xl font-black bg-gradient-to-br from-primary-600 via-primary-500 to-primary-400 bg-clip-text text-transparent">
                                WhatsDeX
                            </SheetTitle>
                        </SheetHeader>
                        {NavContent(true)}
                    </SheetContent>
                </Sheet>
            </div>

            {/* Desktop Sidebar */}
            <motion.aside
                initial={false}
                animate={{
                    x: isSidebarCollapsed ? -176 : 0
                }}
                transition={{
                    type: "spring",
                    stiffness: 300,
                    damping: 30
                }}
                className={cn(
                    "fixed left-0 top-0 z-40 hidden h-screen w-64 border-r border-border/40 bg-[var(--glass-bg)] backdrop-blur-[var(--glass-blur)] lg:block overflow-hidden shadow-2xl shadow-black/10 transition-colors duration-500"
                )}
            >
                <div
                    className="flex h-full flex-col"
                    style={{
                        marginLeft: isSidebarCollapsed ? "176px" : "0px",
                    }}
                >
                    <div className="flex h-16 items-center justify-between px-6 border-b border-border/50">
                        <AnimatePresence mode="wait">
                            {!isSidebarCollapsed && (
                                <motion.span
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -10 }}
                                    className="text-2xl font-black bg-gradient-to-br from-primary-600 via-primary-500 to-primary-400 bg-clip-text text-transparent tracking-tight"
                                >
                                    WhatsDeX
                                </motion.span>
                            )}
                        </AnimatePresence>
                        <Button
                            variant="ghost"
                            size="icon"
                            className={cn(
                                "h-8 w-8 rounded-lg hover:bg-primary/10 text-primary transition-all duration-300 shadow-sm border border-border/20 bg-background/30",
                                isSidebarCollapsed && "mr-2"
                            )}
                            onClick={() => setSidebarCollapsed(!isSidebarCollapsed)}
                        >
                            <motion.div
                                animate={{ rotate: isSidebarCollapsed ? 180 : 0 }}
                                transition={{ type: "spring", stiffness: 200, damping: 20 }}
                            >
                                <ChevronLeft className="h-5 w-5" />
                            </motion.div>
                        </Button>
                    </div>

                    {NavContent(false)}
                </div>
            </motion.aside>
        </>
    );
}
