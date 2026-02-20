'use client';

import React, { useEffect } from 'react';
import { useOmnichannelStore } from '@/stores/useOmnichannelStore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Smartphone, Link as LinkIcon, Link2Off, QrCode, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface ChannelLinkerProps {
    agentId: string;
}

/**
 * Component for linking/unlinking an Agent to Connectivity Slots (Channels).
 */
export function ChannelLinker({ agentId }: ChannelLinkerProps) {
    const { channels, fetchChannels, isLoading } = useOmnichannelStore();

    useEffect(() => {
        fetchChannels();
    }, [fetchChannels]);

    const handleLink = async (channelId: string) => {
        // Logic to link agentId to channelId via backend
        toast.success(`Linking agent to ${channelId}...`);
        // await api.post(...)
        await fetchChannels();
    };

    const handleUnlink = async (channelId: string) => {
        toast.success(`Unlinking agent from ${channelId}...`);
        await fetchChannels();
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Channel Connectivity</h3>
                <Button variant="ghost" size="icon" onClick={() => fetchChannels()} disabled={isLoading}>
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
                        const isLinkedToThisAgent = (channel as any).linkedAgentId === agentId;
                        const isLinkedToOther = (channel as any).linkedAgentId && !isLinkedToThisAgent;

                        return (
                            <Card key={channel.id} className="overflow-hidden">
                                <CardContent className="p-0">
                                    <div className="flex items-center p-4 gap-4">
                                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                                            <Smartphone className="h-6 w-6 text-muted-foreground" />
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2">
                                                <span className="font-semibold">{channel.id}</span>
                                                <Badge variant={channel.status === 'connected' ? 'default' : 'secondary'} className="text-[10px] uppercase">
                                                    {channel.status}
                                                </Badge>
                                            </div>
                                            <div className="text-xs text-muted-foreground capitalize">
                                                {channel.type} Channel
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
                                                    {isLinkedToOther ? 'Linked Elsewhere' : 'Link Brain'}
                                                </Button>
                                            )}
                                            {channel.status === 'qr_pending' && (
                                                <Button variant="secondary" size="sm">
                                                    <QrCode className="mr-2 h-4 w-4" />
                                                    Show QR
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
        </div>
    );
}
