'use client';

import dynamic from 'next/dynamic';

/**
 * Dashboard Client Wrapper (2026 Mastermind Edition)
 * 
 * STRICT: This component isolates the complex DashboardShell from SSR/Prerendering.
 * It must be a Client Component because 'ssr: false' is only allowed here.
 */
const DashboardShell = dynamic(
    () => import('./DashboardShell').then(mod => mod.DashboardShell),
    { ssr: false }
);

export function DashboardClientWrapper({ children }: { children: React.ReactNode }) {
    return <DashboardShell>{children}</DashboardShell>;
}
