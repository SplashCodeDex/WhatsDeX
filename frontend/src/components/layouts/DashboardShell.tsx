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
            <motion.div
                layout
                animate={{
                    paddingLeft: isSidebarCollapsed ? 80 : 256
                }}
                transition={{
                    type: "spring",
                    stiffness: 300,
                    damping: 30
                }}
                className="flex flex-1 flex-col w-full h-full"
            >
                <Header />
                <main className="flex-1 overflow-y-auto p-6 md:p-8">
                    <div className="mx-auto max-w-7xl animate-fade-in space-y-6">
                        {children}
                    </div>
                </main>
            </motion.div>
        </div>
    );
}
