'use client';

import {
    LayoutDashboard,
    ArrowUpRight,
    Users,
    Zap,
    History,
    Search,
    BrainCircuit,
    Sparkles,
    Activity
} from 'lucide-react';
import Link from 'next/link';
import { useEffect } from 'react';

import { GatewayMetrics } from './components/GatewayMetrics';
import { NestedResearchTrace } from './components/NestedResearchTrace';
import { ActivityFeed } from '../omnichannel/components/ActivityFeed';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useAuthStore } from '@/features/auth/store';
import { cn } from '@/lib/utils';
import { useOmnichannelStore } from '@/stores/useOmnichannelStore';


export function HomeFeature() {
    const { fetchGatewayHealth, fetchSkillReport, gatewayHealth, getSkillCount } = useOmnichannelStore();
    const { user } = useAuthStore();

    useEffect(() => {
        fetchGatewayHealth();
        fetchSkillReport();
    }, [fetchGatewayHealth, fetchSkillReport]);

    const firstName = (user?.name ? user.name.split(' ')[0] : 'User') || 'User';
    const skillCount = getSkillCount();
    const activeAgents = gatewayHealth?.agents?.length || 0;

    return (
        <div className="space-y-8 pb-10">
            {/* Hero Section */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary/10 via-background to-background border border-border/50 p-8 md:p-12">
                <div className="relative z-10 max-w-2xl">

                    <h1 className="text-4xl md:text-6xl font-black tracking-tighter text-foreground mb-6 leading-[0.9]">
                        WELCOME BACK, <span className="text-primary truncate">{firstName.toUpperCase()}.</span>
                    </h1>
                    <p className="text-lg text-muted-foreground mb-8 leading-relaxed max-w-md">
                        Your autonomous commerce engine is operational. {skillCount} active skills are currently crawling, analyzing, and executing trades across the omnichannel mesh.
                    </p>
                    <div className="flex flex-wrap gap-4">
                        <Button className="rounded-full px-8 h-12 font-bold uppercase tracking-tight shadow-lg shadow-primary/20 group">
                            Launch Research Unit
                            <Search className="ml-2 w-4 h-4 group-hover:scale-110 transition-transform" />
                        </Button>
                        <Link href="/dashboard/omnichannel">
                            <Button variant="outline" className="rounded-full px-8 h-12 font-bold uppercase tracking-tight backdrop-blur-md">
                                View Hub
                                <ArrowUpRight className="ml-2 w-4 h-4" />
                            </Button>
                        </Link>
                    </div>
                </div>

                {/* Decorative Elements */}
                <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
                <div className="absolute bottom-0 right-0 mr-20 mb-20 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl" />
                <BrainCircuit className="absolute top-1/2 right-12 -translate-y-1/2 w-64 h-64 text-primary/10 opacity-50 hidden lg:block" />
            </div>


            <GatewayMetrics />

            <div className="space-y-8">
                {/* Global Activity */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-sm font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                            <Activity className="w-4 h-4 text-green-500" />
                            Activity Stream
                        </h2>
                    </div>
                    <ActivityFeed />
                </div>

                {/* Research Trace */}
                <div className="w-full">
                    <NestedResearchTrace />
                </div>
            </div>
        </div>
    );
}
