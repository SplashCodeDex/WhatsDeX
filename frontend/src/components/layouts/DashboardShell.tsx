'use client';

import { Sidebar, Header } from '@/components/layouts';
import { useUIStore } from '@/stores/useUIStore';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

export function DashboardShell({
    children,
}: {
    children: React.ReactNode;
}) {
    const { isSidebarCollapsed } = useUIStore();

    return (
        <div className="flex h-screen bg-background text-foreground overflow-hidden">
            <Sidebar />
            <main
                id="main-content"
                className="flex flex-1 flex-col w-full h-full pl-20"
                style={{
                    transform: isSidebarCollapsed ? 'none' : 'translateX(176px)',
                    width: isSidebarCollapsed ? '100%' : 'calc(100% - 176px)',
                    transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), width 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                }}
            >
                <Header />
                <div className="flex-1 overflow-y-auto p-6 md:p-8">
                    <div className="mx-auto max-w-7xl animate-fade-in space-y-6">
                        {children}
                    </div>
                </div>
            </main>
        </div>
    );
}
