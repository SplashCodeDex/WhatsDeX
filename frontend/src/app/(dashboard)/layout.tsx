import { requireAuth } from '@/server/auth/session';
import { DashboardShell } from '@/components/layouts/DashboardShell';

export const dynamic = 'force-dynamic';

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    await requireAuth();

    return <DashboardShell>{children}</DashboardShell>;
}
