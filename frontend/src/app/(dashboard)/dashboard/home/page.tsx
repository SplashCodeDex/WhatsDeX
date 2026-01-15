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

export const metadata: Metadata = {
    title: 'Dashboard Overview',
    description: 'WhatsDeX system overview and statistics',
};

const STATS = [
    {
        title: 'Total Messages',
        value: '12,345',
        change: '+12%',
        trend: 'up',
        icon: MessageSquare,
        color: 'text-blue-500',
        bg: 'bg-blue-500/10',
    },
    {
        title: 'Active Bots',
        value: '3',
        change: '0%',
        trend: 'neutral',
        icon: Bot,
        color: 'text-primary-500',
        bg: 'bg-primary-500/10',
    },
    {
        title: 'Total Contacts',
        value: '1,234',
        change: '+5%',
        trend: 'up',
        icon: Users,
        color: 'text-orange-500',
        bg: 'bg-orange-500/10',
    },
    {
        title: 'System Health',
        value: '99.9%',
        change: '-0.1%',
        trend: 'down',
        icon: Activity,
        color: 'text-green-500',
        bg: 'bg-green-500/10',
    },
];

export default function DashboardHomePage() {
    return (
        <div className="space-y-8">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Overview</h2>
                <p className="text-muted-foreground">
                    Here&apos;s what&apos;s happening with your bots today.
                </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {STATS.map((stat) => (
                    <div
                        key={stat.title}
                        className="rounded-xl border border-border/50 bg-card p-6 shadow-sm transition-all hover:shadow-md"
                    >
                        <div className="flex items-center justify-between space-y-0 pb-2">
                            <p className="text-sm font-medium text-muted-foreground">
                                {stat.title}
                            </p>
                            <div className={cn("rounded-full p-2", stat.bg)}>
                                <stat.icon className={cn("h-4 w-4", stat.color)} />
                            </div>
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="text-2xl font-bold">{stat.value}</div>
                            <div className={cn(
                                "flex items-center text-xs font-medium",
                                stat.trend === 'up' ? "text-green-500" :
                                    stat.trend === 'down' ? "text-red-500" : "text-muted-foreground"
                            )}>
                                {stat.change}
                                {stat.trend === 'up' && <ArrowUpRight className="ml-1 h-3 w-3" />}
                                {stat.trend === 'down' && <ArrowDownRight className="ml-1 h-3 w-3" />}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <div className="col-span-4 rounded-xl border border-border/50 bg-card p-6 shadow-sm">
                    <div className="mb-4">
                        <h3 className="font-semibold leading-none tracking-tight">Recent Activity</h3>
                        <p className="text-sm text-muted-foreground">
                            Latest actions performed by your bots.
                        </p>
                    </div>
                    {/* Placeholder for Activity Feed */}
                    <div className="flex h-[300px] items-center justify-center rounded-lg border border-dashed border-border p-8 text-center animate-in fade-in-50">
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
                    {/* Placeholder for System Status */}
                    <div className="flex h-[300px] items-center justify-center rounded-lg border border-dashed border-border p-8 text-center animate-in fade-in-50">
                        <p className="text-sm text-muted-foreground">System status visualization coming soon.</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
