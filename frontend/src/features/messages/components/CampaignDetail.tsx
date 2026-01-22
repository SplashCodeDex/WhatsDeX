'use client';

import React from 'react';
import { useCampaign } from '../hooks/useCampaigns';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
    ArrowLeft, 
    Send, 
    CheckCircle2, 
    AlertCircle, 
    Clock, 
    Pause, 
    Play, 
    Users, 
    Zap, 
    Sparkles,
    BarChart3,
    Activity,
    Settings2
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

interface CampaignDetailProps {
    id: string;
}

export function CampaignDetail({ id }: CampaignDetailProps) {
    const router = useRouter();
    const { data: campaign, isLoading, error } = useCampaign(id);

    if (isLoading) return (
        <div className="max-w-5xl mx-auto p-8 space-y-8">
            <div className="h-10 w-48 bg-muted/20 animate-pulse rounded-lg" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="h-32 bg-muted/20 animate-pulse rounded-2xl" />
                <div className="h-32 bg-muted/20 animate-pulse rounded-2xl" />
                <div className="h-32 bg-muted/20 animate-pulse rounded-2xl" />
            </div>
            <div className="h-96 bg-muted/20 animate-pulse rounded-2xl" />
        </div>
    );

    if (error || !campaign) return (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
            <AlertCircle className="w-12 h-12 text-destructive" />
            <h2 className="text-xl font-bold">Campaign not found</h2>
            <Button variant="ghost" onClick={() => router.back()}>
                <ArrowLeft className="w-4 h-4 mr-2" /> Go back
            </Button>
        </div>
    );

    const progress = campaign.stats.total > 0
        ? ((campaign.stats.sent + campaign.stats.failed) / campaign.stats.total) * 100
        : 0;

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'sending': return <Badge className="bg-primary/20 text-primary border-primary/20 animate-pulse px-3 py-1"><Activity className="w-3 h-3 mr-1.5" /> Live Sending</Badge>;
            case 'completed': return <Badge className="bg-green-500/20 text-green-500 border-green-500/20 px-3 py-1"><CheckCircle2 className="w-3 h-3 mr-1.5" /> Finished</Badge>;
            case 'paused': return <Badge variant="secondary" className="bg-yellow-500/20 text-yellow-500 border-yellow-500/20 px-3 py-1"><Pause className="w-3 h-3 mr-1.5" /> Interrupted</Badge>;
            default: return <Badge variant="outline" className="px-3 py-1">{status.toUpperCase()}</Badge>;
        }
    };

    return (
        <div className="max-w-5xl mx-auto p-8 space-y-8 animate-in fade-in duration-700">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-1">
                    <button 
                        onClick={() => router.back()}
                        className="flex items-center text-xs font-bold uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors mb-4"
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" /> All Campaigns
                    </button>
                    <div className="flex items-center gap-4">
                        <h1 className="text-4xl font-black tracking-tighter text-foreground">{campaign.name}</h1>
                        {getStatusBadge(campaign.status)}
                    </div>
                    <p className="text-muted-foreground flex items-center gap-2 text-sm pt-1">
                        <Clock className="w-4 h-4" /> Created {formatDistanceToNow(new Date(campaign.createdAt))} ago
                    </p>
                </div>

                <div className="flex gap-3">
                    {campaign.status === 'sending' && (
                        <Button className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold h-12 px-6 shadow-lg shadow-yellow-500/20">
                            <Pause className="w-4 h-4 mr-2" /> Pause Broadcast
                        </Button>
                    )}
                    {campaign.status === 'paused' && (
                        <Button className="bg-primary hover:bg-primary/90 font-bold h-12 px-6 shadow-lg shadow-primary/20">
                            <Play className="w-4 h-4 mr-2" /> Resume Work
                        </Button>
                    )}
                </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { label: 'Success', value: campaign.stats.sent, icon: CheckCircle2, color: 'text-green-500', bg: 'bg-green-500/10' },
                    { label: 'Failures', value: campaign.stats.failed, icon: AlertCircle, color: 'text-red-500', bg: 'bg-red-500/10' },
                    { label: 'Remaining', value: campaign.stats.pending, icon: Clock, color: 'text-blue-500', bg: 'bg-blue-500/10' },
                    { label: 'Total', value: campaign.stats.total, icon: Users, color: 'text-primary', bg: 'bg-primary/10' }
                ].map((stat, i) => (
                    <Card key={i} className="border-border/40 bg-background/50 backdrop-blur-md">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">{stat.label}</span>
                                <div className={cn("p-2 rounded-lg", stat.bg)}>
                                    <stat.icon className={cn("w-4 h-4", stat.color)} />
                                </div>
                            </div>
                            <div className="text-3xl font-black">{stat.value}</div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Main Progress & Configuration */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <Card className="lg:col-span-2 border-border/40 bg-background/50 backdrop-blur-md overflow-hidden">
                    <CardHeader className="border-b border-border/10 bg-muted/5">
                        <CardTitle className="text-lg flex items-center gap-2">
                            <BarChart3 className="w-5 h-5 text-primary" /> Delivery Progress
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-10 space-y-8">
                        <div className="space-y-4">
                            <div className="flex justify-between items-end">
                                <div className="text-5xl font-black text-primary">{Math.round(progress)}%</div>
                                <div className="text-sm font-bold text-muted-foreground pb-1 uppercase tracking-widest">Completed</div>
                            </div>
                            <Progress value={progress} className="h-4 bg-muted/20" />
                        </div>

                        <div className="grid grid-cols-2 gap-8 pt-4">
                            <div className="space-y-2">
                                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Est. Completion</span>
                                <div className="text-lg font-bold">~ 12 minutes</div>
                            </div>
                            <div className="space-y-2">
                                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Throughput</span>
                                <div className="text-lg font-bold">4.2 messages / min</div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-border/40 bg-background/50 backdrop-blur-md">
                    <CardHeader className="border-b border-border/10 bg-muted/5">
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Settings2 className="w-5 h-5 text-primary" /> Configuration
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6 space-y-6">
                        <div className="space-y-4">
                            <div>
                                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2 block">Distribution</Label>
                                <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/30 border border-border/20">
                                    <Zap className="w-4 h-4 text-primary" />
                                    <div className="text-sm font-bold uppercase tracking-tight">{campaign.distribution.type} mode</div>
                                </div>
                            </div>

                            <div>
                                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2 block">Anti-Ban (Delay)</Label>
                                <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/30 border border-border/20">
                                    <Clock className="w-4 h-4 text-blue-500" />
                                    <div className="text-sm font-bold">{campaign.antiBan.minDelay}s - {campaign.antiBan.maxDelay}s</div>
                                </div>
                            </div>

                            {campaign.antiBan.aiSpinning && (
                                <div className="flex items-center gap-2 p-3 rounded-xl bg-primary/10 border border-primary/20 text-primary">
                                    <Sparkles className="w-4 h-4" />
                                    <span className="text-xs font-black uppercase tracking-widest">AI Spinning Active</span>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
