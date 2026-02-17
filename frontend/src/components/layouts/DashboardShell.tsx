'use client';

import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { ScrollToTop } from '../ui/ScrollToTop';
import { useUIStore } from '@/stores/useUIStore';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { ScrollArea } from '../ui/scroll-area';

export function DashboardShell({
    children,
}: {
    children: React.ReactNode;
}) {
    const { isSidebarCollapsed } = useUIStore();

    return (
        <div className="flex h-screen bg-mesh-premium text-foreground overflow-hidden relative">
            {/* Mastermind Ambient Glow Orbs */}
            <div className="glow-orb glow-orb-accent -top-24 -right-24 opacity-[0.77] dark:opacity-[0.92] -z-10" />
            <div className="glow-orb glow-orb-primary -bottom-24 left-1/4 opacity-[0.03] dark:opacity-[0.05] -z-10" />

            <Sidebar />
            <main
                id="main-content"
                className={cn(
                    "flex flex-1 flex-col w-full h-full transition-all duration-300 ease-in-out",
                    "lg:ml-[256px] lg:w-[calc(100%-256px)]",
                    isSidebarCollapsed && "lg:ml-[72px] lg:w-[calc(100%-72px)]"
                )}
            >
                <Header />
                <ScrollArea viewportClassName="p-6 md:p-8">
                    <div className="mx-auto max-w-7xl animate-fade-in space-y-6 pb-24">
                        {children}
                    </div>
                </ScrollArea>
                <ScrollToTop />
            </main>
        </div>
    );
}
