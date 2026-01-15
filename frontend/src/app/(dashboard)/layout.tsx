import { Sidebar, Header } from '@/components/layouts';
import { requireAuth } from '@/server/auth/session';

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    await requireAuth();

    return (
        <div className="flex h-screen bg-background text-foreground">
            <Sidebar />
            <div className="flex flex-1 flex-col transition-all duration-300 md:ml-64">
                <Header />
                <main className="flex-1 overflow-y-auto p-6 md:p-8">
                    <div className="mx-auto max-w-7xl animate-fade-in space-y-6">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}
