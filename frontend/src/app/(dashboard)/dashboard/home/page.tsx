import { Suspense } from 'react';
import { Metadata } from 'next';
import {
    Users,
    MessageSquare,
    Bot,
    Activity,
    ArrowUpRight,
    ArrowDownRight
} from 'lucide-react';

import { cn } from '@/lib/utils';
import { api, API_ENDPOINTS } from '@/lib/api';
import { isApiSuccess } from '@/types';

export const metadata: Metadata = {
    title: 'Dashboard Overview',
    description: 'WhatsDeX system overview and statistics',
};

// Server-side data fetching
async function getDashboardStats() {
    try {
        const response = await api.get<{
            totalBots: number;
            activeBots: number;
            totalMessages: number;
            totalContacts: number;
            systemHealth: string;
            metrics: { memory: number; cpu: number; uptime: number };
        }>(API_ENDPOINTS.ANALYTICS.DASHBOARD);

        if (!isApiSuccess(response)) {
            return null;
        }

        return response.data;
    } catch {
        return null;
    }
}

// Stats Card Component (Pure UI)
interface StatCardProps {
    title: string;
    value: string | number;
    change?: string;
    trend?: 'up' | 'down' | 'neutral';
    icon: React.ElementType;
    color: string;
    bg: string;
}

function StatCard({ title, value, change, trend, icon: Icon, color, bg }: StatCardProps) {
    return (
        <div className="rounded-xl border border-border/50 bg-card p-6 shadow-sm">
            <div className="flex items-center justify-between space-y-0 pb-2">
                <p className="text-sm font-medium text-muted-foreground">{title}</p>
                <div className={cn("rounded-full p-2", bg)}>
                    <Icon className={cn("h-4 w-4", color)} />
                </div>
            </div>
            <div className="flex items-center justify-between">
                <div className="text-2xl font-bold">{value}</div>
                {change && (
                    <div className={cn(
                        "flex items-center text-xs font-medium",
                        trend === 'up' ? "text-green-500" :
                            trend === 'down' ? "text-red-500" : "text-muted-foreground"
                    )}>
                        {change}
                        {trend === 'up' && <ArrowUpRight className="ml-1 h-3 w-3" />}
                        {trend === 'down' && <ArrowDownRight className="ml-1 h-3 w-3" />}
                    </div>
                )}
            </div>
        </div>
    );
}

// Stats Grid using real data
async function StatsGrid() {
    const stats = await getDashboardStats();

    // Define stat cards with actual data
    const STATS: StatCardProps[] = [
        {
            title: 'Total Messages',
            value: stats?.totalMessages.toLocaleString() ?? '0',
            icon: MessageSquare,
            color: 'text-blue-500',
            bg: 'bg-blue-500/10',
        },
        {
            title: 'Active Bots',
            value: stats?.activeBots ?? '0',
            icon: Bot,
            color: 'text-primary-500',
            bg: 'bg-primary-500/10',
        },
        {
            title: 'Total Contacts',
            value: stats?.totalContacts.toLocaleString() ?? '0',
            icon: Users,
            color: 'text-orange-500',
            bg: 'bg-orange-500/10',
        },
        {
            title: 'System Health',
            value: stats?.systemHealth ?? 'Offline',
            icon: Activity,
            color: stats?.systemHealth === 'Healthy' ? 'text-green-500' : 'text-red-500',
            bg: stats?.systemHealth === 'Healthy' ? 'bg-green-500/10' : 'bg-red-500/10',
        },
    ];

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {STATS.map((stat) => (
                <StatCard key={stat.title} {...stat} />
            ))}
        </div>
    );
}

// Loading skeleton for stats
function StatsGridSkeleton() {
    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-[120px] rounded-xl border bg-card/50 p-6 animate-pulse" />
            ))}
        </div>
    );
}

export default async function DashboardHomePage() {
    const dashboardStats = await getDashboardStats();

    return (
        <div className="space-y-8">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Overview</h2>
                <p className="text-muted-foreground">
                    Here&apos;s what&apos;s happening with your bots today.
                </p>
            </div>

            {/* Stats from Server Component */}
            <Suspense fallback={<StatsGridSkeleton />}>
                <StatsGrid />
            </Suspense>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <div className="col-span-4 rounded-xl border border-border/50 bg-card p-6 shadow-sm">
                    <div className="mb-4">
                        <h3 className="font-semibold leading-none tracking-tight">Recent Activity</h3>
                        <p className="text-sm text-muted-foreground">
                            Latest actions performed by your bots.
                        </p>
                    </div>
                    {/* Empty state until activity feed is wired */}
                    <div className="flex h-[300px] items-center justify-center rounded-lg border border-dashed border-border p-8 text-center">
                        <div className="mx-auto flex max-w-[420px] flex-col items-center justify-center text-center">
                            <Activity className="h-10 w-10 text-muted-foreground" />
                            <h3 className="mt-4 text-lg font-semibold">No recent activity</h3>
                            <p className="mb-4 mt-2 text-sm text-muted-foreground">
                                Activity logs will appear here once your bots start processing messages.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="col-span-3 rounded-xl border border-border/50 bg-card p-6 shadow-sm">
                    <div className="mb-4">
                        <h3 className="font-semibold leading-none tracking-tight">System Status</h3>
                        <p className="text-sm text-muted-foreground">
                            Real-time server performance.
                        </p>
                    </div>
                    {/* Real system metrics */}
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">CPU Usage</span>
                                <span className="font-medium">{dashboardStats?.metrics.cpu ?? 0}%</span>
                            </div>
                            <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                                <div
                                    className="h-full bg-primary-500"
                                    style={{ width: `${dashboardStats?.metrics.cpu ?? 0}%` }}
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">Memory</span>
                                <span className="font-medium">{dashboardStats?.metrics.memory ?? 0} MB</span>
                            </div>
                            <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                                <div
                                    className="h-full bg-accent-500"
                                    style={{ width: `${Math.min(100, (dashboardStats?.metrics.memory ?? 0) / 10)}%` }}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
