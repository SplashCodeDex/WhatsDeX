import { requireAuth } from '@/server/auth/session';
import { DashboardShell } from '@/components/layouts/DashboardShell';

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    await requireAuth();

    return <DashboardShell>{children}</DashboardShell>;
}
