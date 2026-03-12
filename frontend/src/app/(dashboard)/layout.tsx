import { DashboardShell } from '@/components/layouts/DashboardShell';
import { requireAuth } from '@/server/auth/session';

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    await requireAuth();

    return <DashboardShell>{children}</DashboardShell>;
}
