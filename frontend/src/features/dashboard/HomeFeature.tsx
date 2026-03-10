'use client';

import { useEffect } from 'react';
import { useOmnichannelStore } from '@/stores/useOmnichannelStore';
import { GatewayMetrics } from './components/GatewayMetrics';
import { NestedResearchTrace } from './components/NestedResearchTrace';
import { ActivityFeed } from '../omnichannel/components/ActivityFeed';
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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import Link from 'next/link';

export function HomeFeature() {
    const { fetchGatewayHealth, activity } = useOmnichannelStore();

    useEffect(() => {
        fetchGatewayHealth();
    }, [fetchGatewayHealth]);

    return (
        <div className="space-y-8 pb-10">
            {/* Hero Section */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary/10 via-background to-background border border-border/50 p-8 md:p-12">
                <div className="relative z-10 max-w-2xl">
                    <Badge variant="outline" className="mb-4 bg-primary/5 text-primary border-primary/20 font-mono tracking-widest text-[10px] uppercase py-1 px-3">
                        <Sparkles className="w-3 h-3 mr-2 inline-block" />
                        DeXMart 2026 Mastermind Edition
                    </Badge>
                    <h1 className="text-4xl md:text-6xl font-black tracking-tighter text-foreground mb-6 leading-[0.9]">
                        WELCOME BACK, <span className="text-primary">ADEMA.</span>
                    </h1>
                    <p className="text-lg text-muted-foreground mb-8 leading-relaxed max-w-md">
                        Your autonomous commerce engine is operational. 51 active skills are currently crawling, analyzing, and executing trades across the omnichannel mesh.
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

            {/* Metrics Grid */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-sm font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                        <Zap className="w-4 h-4 text-orange-500" />
                        Core Infrastructure
                    </h2>
                    <Badge variant="outline" className="text-[10px] font-mono">Real-time Syncing</Badge>
                </div>
                <GatewayMetrics />
            </div>

            <div className="grid lg:grid-cols-3 gap-8">
                {/* Left Column: Trace & Intelligence */}
                <div className="lg:col-span-2 space-y-8">
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-sm font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                                <BrainCircuit className="w-4 h-4 text-primary" />
                                Mastermind Intelligence
                            </h2>
                        </div>
                        <NestedResearchTrace />
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                        <Card className="border-border/40 bg-card/60 backdrop-blur-sm group hover:border-primary/30 transition-all">
                            <CardHeader className="pb-2">
                                <Users className="w-5 h-5 text-blue-500 mb-2" />
                                <CardTitle className="text-lg">Multi-Tenant Status</CardTitle>
                                <CardDescription>Isolated secure environments</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-black">12 ACTIVE</div>
                                <div className="mt-2 h-1.5 w-full bg-muted rounded-full overflow-hidden">
                                    <div className="h-full bg-blue-500 w-[65%]" />
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border-border/40 bg-card/60 backdrop-blur-sm group hover:border-orange-500/30 transition-all text-foreground">
                            <CardHeader className="pb-2">
                                <History className="w-5 h-5 text-orange-500 mb-2" />
                                <CardTitle className="text-lg">Skill Execution</CardTitle>
                                <CardDescription>Success rate last 24h</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-black">99.8%</div>
                                <div className="mt-2 h-1.5 w-full bg-muted rounded-full overflow-hidden">
                                    <div className="h-full bg-orange-500 w-[99.8%]" />
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                {/* Right Column: Global Activity */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-sm font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                            <Activity className="w-4 h-4 text-green-500" />
                            Activity Stream
                        </h2>
                    </div>
                    <ActivityFeed />
                </div>
            </div>
        </div>
    );
}
