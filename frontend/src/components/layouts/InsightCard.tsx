'use client';

import { Bot, CreditCard, MessageSquare, ShieldCheck, Activity } from 'lucide-react';

import { useBots } from '@/features/bots/hooks/useBots';
import { useSubscription } from '@/features/billing/hooks/useSubscription';

interface InsightCardProps {
    type: 'dashboard' | 'bots' | 'messages' | 'billing' | 'contacts' | 'settings';
}

export function InsightCard({ type }: InsightCardProps) {
    const { data: bots } = useBots();
    const { subscription, limits } = useSubscription();

    const stats = {
        bots: {
            connected: bots?.filter(b => b.status === 'connected').length || 0,
            total: bots?.length || 0,
            disconnected: bots?.filter(b => b.status !== 'connected').length || 0,
        },
        billing: {
            plan: subscription?.planTier || 'Starter',
            limit: limits?.maxBots || 1,
            status: subscription?.status || 'active',
        },
        messages: {
            total: bots?.reduce((acc, b) => acc + (b.messageCount || 0), 0) || 0,
            limit: 5000,
        }
    };

    const renderContent = () => {
        switch (type) {
            case 'bots':
                return (
                    <div className="space-y-3">
                        <div className="flex items-center justify-between gap-4">
                            <div className="flex items-center gap-2">
                                <Bot className="h-4 w-4 text-primary" />
                                <span className="font-semibold text-sm">Bot Status</span>
                            </div>
                            <span className="text-[10px] uppercase tracking-wider text-muted-foreground bg-muted px-1.5 py-0.5 rounded">Live</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <div className="bg-muted/50 p-2 rounded-lg border border-border/50">
                                <div className="text-[10px] text-muted-foreground uppercase">Connected</div>
                                <div className="text-lg font-bold text-primary">{stats.bots.connected}</div>
                            </div>
                            <div className="bg-muted/50 p-2 rounded-lg border border-border/50">
                                <div className="text-[10px] text-muted-foreground uppercase">Offline</div>
                                <div className="text-lg font-bold text-destructive">{stats.bots.disconnected}</div>
                            </div>
                        </div>
                    </div>
                );
            case 'billing':
                return (
                    <div className="space-y-3">
                        <div className="flex items-center gap-2">
                            <ShieldCheck className="h-4 w-4 text-primary" />
                            <span className="font-semibold text-sm">Subscription</span>
                        </div>
                        <div className="space-y-2">
                            <div className="flex items-center justify-between text-xs">
                                <span className="text-muted-foreground">Current Plan</span>
                                <span className="font-bold capitalize text-primary">{stats.billing.plan}</span>
                            </div>
                            <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-primary"
                                    style={{ width: `${(stats.bots.total / stats.billing.limit) * 100}%` }}
                                />
                            </div>
                            <div className="flex justify-between text-[10px] text-muted-foreground">
                                <span>{stats.bots.total} of {stats.billing.limit} bots</span>
                                <span>{Math.round((stats.bots.total / stats.billing.limit) * 100)}%</span>
                            </div>
                        </div>
                    </div>
                );
            case 'messages':
                return (
                    <div className="space-y-3">
                        <div className="flex items-center gap-2">
                            <Activity className="h-4 w-4 text-primary" />
                            <span className="font-semibold text-sm">Activity</span>
                        </div>
                        <div className="bg-muted/50 p-3 rounded-lg border border-border/50 flex items-center justify-between">
                            <div className="space-y-0.5">
                                <div className="text-[10px] text-muted-foreground uppercase">Total Processed</div>
                                <div className="text-xl font-bold">{stats.messages.total.toLocaleString()}</div>
                            </div>
                            <MessageSquare className="h-8 w-8 text-primary/10" />
                        </div>
                    </div>
                );
            default:
                return (
                    <div className="text-center py-2">
                        <span className="text-xs text-muted-foreground italic">Quick access to {type}</span>
                    </div>
                );
        }
    };

    return (
        <div className="w-56 p-1">
            {renderContent()}
        </div>
    );
}
