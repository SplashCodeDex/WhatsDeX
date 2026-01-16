'use client';

import React from 'react';
import { useCampaigns, useStartCampaign, useDeleteCampaign } from '../hooks/useCampaigns.js';
import { Button } from '@/components/ui/button.js';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card.js';
import { Badge } from '@/components/ui/badge.js';
import { Progress } from '@/components/ui/progress.js';
import { Play, Trash2, Clock, Send, AlertCircle, CheckCircle2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export function CampaignList() {
    const { data: campaigns, isLoading, error } = useCampaigns();
    const startMutation = useStartCampaign();
    const deleteMutation = useDeleteCampaign();

    if (isLoading) return <div className="p-8 text-center text-muted-foreground">Loading campaigns...</div>;
    if (error) return <div className="p-8 text-center text-destructive">Error loading campaigns</div>;

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'sending': return <Badge className="bg-blue-500 animate-pulse">Sending</Badge>;
            case 'completed': return <Badge className="bg-green-500">Completed</Badge>;
            case 'draft': return <Badge variant="outline">Draft</Badge>;
            case 'error': return <Badge variant="destructive">Error</Badge>;
            case 'paused': return <Badge variant="secondary">Paused</Badge>;
            default: return <Badge variant="outline">{status}</Badge>;
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'sending': return <Send className="w-4 h-4 text-blue-500" />;
            case 'completed': return <CheckCircle2 className="w-4 h-4 text-green-500" />;
            case 'error': return <AlertCircle className="w-4 h-4 text-destructive" />;
            default: return <Clock className="w-4 h-4 text-muted-foreground" />;
        }
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
            {campaigns?.map((campaign) => {
                const progress = campaign.stats.total > 0
                    ? ((campaign.stats.sent + campaign.stats.failed) / campaign.stats.total) * 100
                    : 0;

                return (
                    <Card key={campaign.id} className="overflow-hidden border-zinc-800 bg-zinc-900/50 backdrop-blur-sm group hover:border-zinc-700 transition-all">
                        <CardHeader className="pb-2">
                            <div className="flex justify-between items-start">
                                <CardTitle className="text-lg font-bold text-zinc-100">{campaign.name}</CardTitle>
                                {getStatusBadge(campaign.status)}
                            </div>
                            <CardDescription className="flex items-center gap-2 text-xs text-zinc-400">
                                {getStatusIcon(campaign.status)}
                                Created {formatDistanceToNow(new Date(campaign.createdAt))} ago
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="text-sm text-zinc-300 line-clamp-2 bg-black/20 p-2 rounded italic">
                                "{campaign.message}"
                            </div>

                            <div className="space-y-1">
                                <div className="flex justify-between text-xs text-zinc-400">
                                    <span>Progress</span>
                                    <span>{Math.round(progress)}%</span>
                                </div>
                                <Progress value={progress} className="h-1.5" />
                                <div className="flex justify-between text-[10px] text-zinc-500 pt-1">
                                    <span>Sent: {campaign.stats.sent}</span>
                                    <span>Failed: {campaign.stats.failed}</span>
                                    <span>Total: {campaign.stats.total}</span>
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter className="flex justify-between pt-0">
                            <div className="flex gap-2">
                                {campaign.status === 'draft' && (
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        className="h-8 group-hover:bg-blue-500/10 group-hover:text-blue-400"
                                        onClick={() => startMutation.mutate(campaign.id)}
                                        disabled={startMutation.isPending}
                                    >
                                        <Play className="w-4 h-4 mr-1" /> Start
                                    </Button>
                                )}
                            </div>
                            <Button
                                size="sm"
                                variant="ghost"
                                className="h-8 text-zinc-500 hover:text-red-400 hover:bg-red-400/10"
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
                <div className="col-span-full py-20 text-center border-2 border-dashed border-zinc-800 rounded-xl bg-zinc-900/20">
                    <div className="bg-zinc-800 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Send className="w-6 h-6 text-zinc-500" />
                    </div>
                    <p className="text-zinc-400">No campaigns found. Create your first broadcast to engage your audience.</p>
                </div>
            )}
        </div>
    );
}
