'use client';

import React, { useEffect, useState } from 'react';
import { useOmnichannelStore } from '@/stores/useOmnichannelStore';
import { useAuth } from '@/features/auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Smartphone, Link as LinkIcon, Link2Off, QrCode, RefreshCw, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { canAddChannelSlot, getSlotLimit } from '../utils/ChannelSlotGuard';
import Link from 'next/link';
import { api, API_ENDPOINTS } from '@/lib/api';

interface ChannelLinkerProps {
    agentId: string;
}

/**
 * Component for linking/unlinking an Agent to Connectivity Slots (Channels).
 * Enforces billing tier limits on active connections.
 */
export function ChannelLinker({ agentId }: ChannelLinkerProps) {
    const { user } = useAuth();
    const { channels, fetchAllChannels, isLoading } = useOmnichannelStore();
    const [isUpgradeOpen, setIsUpgradeOpen] = useState(false);

    useEffect(() => {
        fetchAllChannels();
    }, [fetchAllChannels]);

    const userTier = user?.plan || 'starter';
    const activeLinkedChannels = channels.filter(c => c.assignedAgentId && c.assignedAgentId !== 'system_default').length;

    const handleLink = async (channelId: string) => {
        // Check if user can add another active connection
        if (!canAddChannelSlot(userTier, activeLinkedChannels)) {
            setIsUpgradeOpen(true);
            return;
        }

        toast.promise(
            // To link in hierarchy, we move the channel document
            // We'll need a backend endpoint for "moveChannel" or just use updateChannel
            api.patch(API_ENDPOINTS.BOTS.UPDATE(channelId), { assignedAgentId: agentId }),
            {
                loading: 'Linking agent to connection...',
                success: () => {
                    fetchAllChannels();
                    return `Linked successfully!`;
                },
                error: (err) => err.message || 'Failed to link agent',
            }
        );
    };

    const handleUnlink = async (channelId: string) => {
        toast.promise(
            api.patch(API_ENDPOINTS.BOTS.UPDATE(channelId), { assignedAgentId: 'system_default' }),
            {
                loading: 'Unlinking agent...',
                success: () => {
                    fetchAllChannels();
                    return `Unlinked successfully! (Moved to default pool)`;
                },
                error: (err) => err.message || 'Failed to unlink agent',
            }
        );
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div className="space-y-1">
                    <h3 className="text-lg font-semibold">Channel Connectivity</h3>
                    <p className="text-xs text-muted-foreground">
                        Agent Specific Connections: {channels.filter(c => c.assignedAgentId === agentId).length}
                    </p>
                </div>
                <Button variant="ghost" size="icon" onClick={() => fetchAllChannels()} disabled={isLoading}>
                    <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
                </Button>
            </div>

            <div className="grid gap-4">
                {channels.length === 0 ? (
                    <Card className="border-dashed">
                        <CardContent className="py-8 text-center text-sm text-muted-foreground">
                            No channels configured. Visit the Omnichannel Hub to add one.
                        </CardContent>
                    </Card>
                ) : (
                    channels.map((channel) => {
                        const isLinkedToThisAgent = channel.assignedAgentId === agentId;
                        const isLinkedToOther = !!(channel.assignedAgentId && channel.assignedAgentId !== 'system_default' && !isLinkedToThisAgent);
                        const isAvailable = !channel.assignedAgentId || channel.assignedAgentId === 'system_default';

                        if (!isLinkedToThisAgent && !isAvailable) return null; // Only show relevant ones

                        return (
                            <Card key={channel.id} className="overflow-hidden">
                                <CardContent className="p-0">
                                    <div className="flex items-center p-4 gap-4">
                                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                                            <Smartphone className="h-6 w-6 text-muted-foreground" />
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2">
                                                <span className="font-semibold">{channel.name || channel.id}</span>
                                                <Badge variant={channel.status === 'connected' ? 'default' : 'secondary'} className="text-[10px] uppercase">
                                                    {channel.status}
                                                </Badge>
                                            </div>
                                            <div className="text-xs text-muted-foreground capitalize">
                                                {channel.type} Channel • {channel.account || 'No ID'}
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            {isLinkedToThisAgent ? (
                                                <Button variant="destructive" size="sm" onClick={() => handleUnlink(channel.id)}>
                                                    <Link2Off className="mr-2 h-4 w-4" />
                                                    Unlink Agent
                                                </Button>
                                            ) : (
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => handleLink(channel.id)}
                                                    disabled={isLinkedToOther}
                                                >
                                                    <LinkIcon className="mr-2 h-4 w-4" />
                                                    {isLinkedToOther ? 'Linked Elsewhere' : 'Link to Agent'}
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                    {isLinkedToThisAgent && (
                                        <div className="bg-primary/5 px-4 py-2 text-[10px] font-bold text-primary uppercase tracking-widest border-t border-primary/10">
                                            Currently Linked to this Brain
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        );
                    })
                )}
            </div>

            <Dialog open={isUpgradeOpen} onOpenChange={setIsUpgradeOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Sparkles className="h-5 w-5 text-primary" />
                            Upgrade Your Plan
                        </DialogTitle>
                        <DialogDescription className="pt-2">
                            You've reached the active connection limit for your <strong>{userTier}</strong> plan ({getSlotLimit(userTier)} slot).
                            Upgrade to Pro or Enterprise to link more agents to more channels simultaneously.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="mt-4">
                        <Button variant="outline" onClick={() => setIsUpgradeOpen(false)}>
                            Maybe Later
                        </Button>
                        <Button asChild>
                            <Link href="/dashboard/billing">
                                View Plans
                            </Link>
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
