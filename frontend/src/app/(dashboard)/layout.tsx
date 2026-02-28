import { requireAuth } from '@/server/auth/session';
import { DashboardShell } from '@/components/layouts/DashboardShell';

// 2026 Mastermind Note: Mark dashboard layout as force-dynamic.
// This is now compatible since cacheComponents is disabled in next.config.ts.
// It ensures that authenticated pages are never statically prerendered at build time.
export const dynamic = 'force-dynamic';

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    await requireAuth();

    return <DashboardShell>{children}</DashboardShell>;
}
