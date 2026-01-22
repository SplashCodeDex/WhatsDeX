'use client';

import React from 'react';
import { useCampaigns, useStartCampaign, useDeleteCampaign, usePauseCampaign, useResumeCampaign, useDuplicateCampaign } from '../hooks/useCampaigns';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Play, Trash2, Clock, Send, AlertCircle, CheckCircle2, Pause, BarChart3 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

export function CampaignList() {
    const { data: campaigns, isLoading, error } = useCampaigns();
    const startMutation = useStartCampaign();
    const pauseMutation = usePauseCampaign();
    const resumeMutation = useResumeCampaign();
    const duplicateMutation = useDuplicateCampaign();
    const deleteMutation = useDeleteCampaign();

    if (isLoading) return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
            {[1, 2, 3].map(i => (
                <div key={i} className="h-48 rounded-2xl bg-muted/20 animate-pulse" />
            ))}
        </div>
    );
    if (error) return <div className="p-8 text-center text-destructive">Error loading campaigns</div>;

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'sending': return <Badge className="bg-primary/20 text-primary border-primary/20 animate-pulse"><Send className="w-3 h-3 mr-1" /> Sending</Badge>;
            case 'completed': return <Badge className="bg-green-500/20 text-green-500 border-green-500/20"><CheckCircle2 className="w-3 h-3 mr-1" /> Completed</Badge>;
            case 'draft': return <Badge variant="outline" className="border-border text-muted-foreground">Draft</Badge>;
            case 'error': return <Badge variant="destructive" className="bg-destructive/20 text-destructive border-destructive/20">Error</Badge>;
            case 'paused': return <Badge variant="secondary" className="bg-yellow-500/20 text-yellow-500 border-yellow-500/20"><Pause className="w-3 h-3 mr-1" /> Paused</Badge>;
            default: return <Badge variant="outline">{status}</Badge>;
        }
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
            {campaigns?.map((campaign) => {
                const progress = campaign.stats.total > 0
                    ? ((campaign.stats.sent + campaign.stats.failed) / campaign.stats.total) * 100
                    : 0;

                return (
                    <Card key={campaign.id} className="group overflow-hidden border-border/40 bg-background/50 backdrop-blur-md hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300">
                        <CardHeader className="pb-3">
                            <div className="flex justify-between items-start mb-1">
                                <CardTitle className="text-lg font-bold bg-gradient-to-br from-foreground to-foreground/80 bg-clip-text text-transparent truncate pr-4">
                                    {campaign.name}
                                </CardTitle>
                                {getStatusBadge(campaign.status)}
                            </div>
                            <CardDescription className="flex items-center gap-2 text-xs text-muted-foreground">
                                <Clock className="w-3 h-3" />
                                {formatDistanceToNow(new Date(campaign.createdAt))} ago
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-5">
                            <div className="relative p-3 rounded-lg bg-muted/30 border border-border/30">
                                <div className="text-sm text-foreground/80 italic font-medium line-clamp-2">
                                    "{campaign.templateId}"
                                </div>
                                <div className="absolute top-2 right-2 text-primary/10">
                                    <Send className="w-8 h-8 rotate-12" />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <div className="flex justify-between text-xs font-semibold text-muted-foreground">
                                    <span className="flex items-center gap-1"><BarChart3 className="w-3 h-3" /> Progress</span>
                                    <span>{Math.round(progress)}%</span>
                                </div>
                                <Progress value={progress} className="h-2" />
                                <div className="grid grid-cols-3 gap-2 pt-1">
                                    <div className="text-center p-1 rounded bg-green-500/5 border border-green-500/10">
                                        <div className="text-[10px] text-muted-foreground uppercase">Sent</div>
                                        <div className="text-sm font-bold text-green-500">{campaign.stats.sent}</div>
                                    </div>
                                    <div className="text-center p-1 rounded bg-red-500/5 border border-red-500/10">
                                        <div className="text-[10px] text-muted-foreground uppercase">Failed</div>
                                        <div className="text-sm font-bold text-red-500">{campaign.stats.failed}</div>
                                    </div>
                                    <div className="text-center p-1 rounded bg-blue-500/5 border border-blue-500/10">
                                        <div className="text-[10px] text-muted-foreground uppercase">Total</div>
                                        <div className="text-sm font-bold text-blue-500">{campaign.stats.total}</div>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter className="flex justify-between pt-2 border-t border-border/20">
                            <div className="flex gap-2">
                                {campaign.status === 'draft' && (
                                    <Button
                                        size="sm"
                                        className="h-8 bg-primary/10 text-primary hover:bg-primary/20 border border-primary/20 shadow-none"
                                        onClick={() => startMutation.mutate(campaign.id)}
                                        disabled={startMutation.isPending}
                                    >
                                        <Play className="w-3 h-3 mr-1.5" /> Start Now
                                    </Button>
                                )}
                                {campaign.status === 'sending' && (
                                    <Button
                                        size="sm"
                                        className="h-8 bg-yellow-500/10 text-yellow-600 hover:bg-yellow-500/20 border border-yellow-500/20 shadow-none"
                                        onClick={() => pauseMutation.mutate(campaign.id)}
                                        disabled={pauseMutation.isPending}
                                    >
                                        <Pause className="w-3 h-3 mr-1.5" /> Pause
                                    </Button>
                                )}
                                {campaign.status === 'paused' && (
                                    <Button
                                        size="sm"
                                        className="h-8 bg-primary/10 text-primary hover:bg-primary/20 border border-primary/20 shadow-none"
                                        onClick={() => resumeMutation.mutate(campaign.id)}
                                        disabled={resumeMutation.isPending}
                                    >
                                        <Play className="w-3 h-3 mr-1.5" /> Resume
                                    </Button>
                                )}
                                <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-8 border-border/40 hover:bg-muted/10 group-hover:border-primary/20 transition-all shadow-none"
                                    onClick={() => duplicateMutation.mutate(campaign.id)}
                                    disabled={duplicateMutation.isPending}
                                >
                                    <Clock className="w-3 h-3 mr-1.5" /> Duplicate
                                </Button>
                            </div>
                            <Button
                                size="sm"
                                variant="ghost"
                                className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                                onClick={() => {
                                    if (confirm('Delete this campaign?')) {
                                        deleteMutation.mutate(campaign.id);
                                    }
                                }}
                                disabled={deleteMutation.isPending}
                            >
                                <Trash2 className="w-4 h-4" />
                            </Button>
                        </CardFooter>
                    </Card>
                );
            })}

            {campaigns?.length === 0 && (
                <div className="col-span-full py-20 flex flex-col items-center justify-center text-center border-2 border-dashed border-border/40 rounded-3xl bg-muted/5">
                    <div className="p-4 rounded-full bg-primary/10 mb-4 animate-bounce">
                        <Send className="w-8 h-8 text-primary" />
                    </div>
                    <h3 className="text-lg font-bold text-foreground">No broadcasts yet</h3>
                    <p className="text-muted-foreground max-w-sm mt-2 mb-6">
                        Start engaging your customers by creating your first broadcast campaign.
                    </p>
                    <div className="opacity-50 pointer-events-none">
                        <Button variant="outline">Create Validation Campaign</Button>
                    </div>
                </div>
            )}
        </div>
    );
}
