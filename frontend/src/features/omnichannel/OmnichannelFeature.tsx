'use client';

import {
    Activity,
    MessageSquare,
    Plus,
    Power,
    RefreshCw,
    Settings2,
    Users,
    Wifi,
    WifiOff,
    AlertTriangle,
    Slack,
    Hash,
    Network
} from "lucide-react";
import Link from 'next/link';
import React, { useEffect, useState } from 'react';
import { SiWhatsapp, SiTelegram, SiDiscord, SiSignal, SiGooglechat, SiFacebook } from 'react-icons/si';

import { ActivityFeed } from './components/ActivityFeed';
import { ChannelProgressStepper } from './components/ChannelProgressStepper';
import { OmnichannelSocketManager } from './components/OmnichannelSocketManager';

import { ChannelConnectionForm } from '@/components/omnichannel/ChannelConnectionForm';
import { ChannelSettingsDialog } from '@/components/omnichannel/ChannelSettingsDialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { useOmnichannelStore } from '@/stores/useOmnichannelStore';
import type { Channel } from '@/types/omnichannel';


// Helper for accessibility
function VisuallyHidden({ children }: { children: React.ReactNode }): React.JSX.Element {
  return <span className="absolute w-[1px] h-[1px] p-0 -m-[1px] overflow-hidden clip-[rect(0,0,0,0)] whitespace-nowrap border-0">
        {children}
    </span>
}

type IconComponent = React.ComponentType<{ className?: string }>;
const ICON_MAP: Record<string, IconComponent> = {
    SiWhatsapp,
    SiTelegram,
    SiDiscord,
    Slack,
    SiSignal,
    MessageSquare,
    Hash,
    SiGooglechat,
    SiFacebook,
    SiMicrosoftteams: Users,
    SiMatrix: Network
};

function ChannelCard({ channel }: { channel: Channel }): React.JSX.Element {
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [isDisconnecting, setIsDisconnecting] = useState(false);
    const { agentsResult, disconnectChannel, platforms } = useOmnichannelStore();
    
    // Dynamic metadata lookup
    const platform = platforms.find(p => p.id === channel.type);
    const Icon = ICON_MAP[platform?.icon || ''] || MessageSquare;
    const color = platform?.color || 'bg-primary';

    const isConnecting = channel.status === 'connecting' || channel.status === 'initializing' || channel.status === 'qr_pending';
    const isTerminal = channel.status === 'banned' || channel.status === 'reconnect_exhausted';

    const STATUS_BADGE: Record<string, { variant: 'default' | 'destructive' | 'secondary' | 'outline'; label: string }> = {
        connected:           { variant: 'default',     label: 'Connected' },
        connecting:          { variant: 'secondary',   label: 'Connecting' },
        initializing:        { variant: 'secondary',   label: 'Starting' },
        qr_pending:          { variant: 'secondary',   label: 'Scan QR' },
        disconnected:        { variant: 'outline',     label: 'Offline' },
        logged_out:          { variant: 'outline',     label: 'Logged Out' },
        error:               { variant: 'destructive', label: 'Error' },
        reconnect_exhausted: { variant: 'destructive', label: 'Retry Failed' },
        banned:              { variant: 'destructive', label: 'Banned' },
        archived:            { variant: 'outline',     label: 'Archived' },
    };

    const STATUS_MESSAGE: Record<string, string> = {
        connected:           'Bot is active and listening',
        disconnected:        'Bot is currently offline',
        logged_out:          'Session expired — reconnect to get a new QR code',
        error:               'Connection failed — use Manage to retry',
        reconnect_exhausted: 'Auto-reconnect failed — use Manage to retry manually',
        banned:              'Number banned by WhatsApp — this number must be replaced',
        archived:            'Channel is archived',
    };

    const badge = STATUS_BADGE[channel.status] ?? { variant: 'secondary' as const, label: channel.status };

    const effectiveAgentId = channel.assignedAgentId || 'system_default';
    const agent = agentsResult?.agents.find(a => a.id === effectiveAgentId);
    const agentName = agent?.name || 'System Default Agent';

    const handleDirectDisconnect = async (e: React.MouseEvent): Promise<void> => {
        e.stopPropagation();
        if (isDisconnecting) return;

        setIsDisconnecting(true);
        try {
            const agentId = channel.assignedAgentId || 'system_default';
            const success = await disconnectChannel(agentId, channel.id);
            if (success) {
                // Success toast handled by component or store?
            }
        } finally {
            setIsDisconnecting(false);
        }
    };

    return (
        <>
            <Card className="overflow-hidden border-border/50 bg-card/40 backdrop-blur-md transition-all hover:shadow-md h-full flex flex-col">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <div className="flex items-center space-x-2">
                        <div className={cn("rounded-lg p-2 text-white", color)}>
                            <Icon className="h-5 w-5" />
                        </div>
                        <div>
                            <CardTitle className="text-lg">{channel.name}</CardTitle>
                            <div className="flex items-center gap-2 mt-0.5">
                                <CardDescription>
                                    {channel.account || (isConnecting ? 'Connecting...' : 'Not configured')}
                                </CardDescription>
                                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 font-medium text-foreground">
                                    {agentName}
                                </span>
                            </div>
                        </div>
                    </div>
                    <Badge variant={badge.variant}>
                        {badge.label}
                    </Badge>
                </CardHeader>
                <CardContent className="pt-4 flex-1">
                    {isConnecting ? (
                        <ChannelProgressStepper
                            channelId={channel.id}
                            agentId={channel.assignedAgentId || 'system_default'}
                            channelStatus={channel.status}
                            currentStep={channel.lastProgress?.step || "Starting Connection"}
                            status={channel.lastProgress?.status || "in_progress"}
                        />
                    ) : (
                        <div className="flex items-center text-sm text-muted-foreground">
                            {channel.status === 'connected' ? (
                                <Wifi className="mr-2 h-4 w-4 text-green-500" />
                            ) : (isTerminal || channel.status === 'error') ? (
                                <AlertTriangle className="mr-2 h-4 w-4 text-destructive" />
                            ) : (
                                <WifiOff className="mr-2 h-4 w-4" />
                            )}
                            <span>
                                {STATUS_MESSAGE[channel.status] ?? 'Bot is currently offline'}
                            </span>
                        </div>
                    )}
                </CardContent>
                <CardFooter className="bg-muted/30 border-t border-border/50 py-2 mt-auto flex gap-2">
                    <Button
                        variant="ghost"
                        size="sm"
                        className="flex-1 justify-between font-normal"
                        onClick={() => setIsSettingsOpen(true)}
                    >
                        <span>Manage connection</span>
                        <Settings2 className="h-4 w-4" />
                    </Button>
                    {(channel.status === 'connected' || isConnecting) && !isTerminal ? <Button
                            variant="ghost"
                            size="icon"
                            className={cn(
                                "h-8 w-8 shrink-0",
                                isConnecting
                                    ? "text-destructive hover:text-destructive hover:bg-destructive/10"
                                    : "text-orange-500 hover:text-orange-600 hover:bg-orange-500/10"
                            )}
                            onClick={handleDirectDisconnect}
                            disabled={isDisconnecting}
                            title={isConnecting ? "Abort Connection" : "Disconnect Bot"}
                        >
                            {isDisconnecting ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Power className="h-4 w-4" />}
                        </Button> : null}
                </CardFooter>
            </Card>

            <ChannelSettingsDialog
                channel={channel}
                isOpen={isSettingsOpen}
                onOpenChange={setIsSettingsOpen}
            />
        </>
    );
}

export function OmnichannelFeature(): React.JSX.Element {
    const { channels, isLoading, fetchAllChannels, fetchPlatforms, platforms } = useOmnichannelStore();
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [selectedPlatform, setSelectedPlatform] = useState<string>('whatsapp');

    useEffect(() => {
        fetchAllChannels();
        fetchPlatforms();
    }, [fetchAllChannels, fetchPlatforms]);

    // Derived platforms with icons for the UI
    const PLATFORMS = platforms.map(p => ({
        ...p,
        Icon: ICON_MAP[p.icon] || MessageSquare,
        // Ensure color is a text- color for the icon and bg- color for the background
        textColor: p.color.replace('bg-', 'text-'),
        bgColor: p.color
    }));

    return (
        <div className="space-y-8">
            <OmnichannelSocketManager />

            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-foreground">Omnichannel Hub</h2>
                    <p className="text-muted-foreground">
                        Central command for all your social messaging platforms.
                    </p>
                </div>
                <div className="flex space-x-2">
                    <Button variant="outline" size="icon" onClick={() => fetchAllChannels()} disabled={isLoading}>
                        <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
                    </Button>

                    <Button variant="secondary" asChild className="hidden sm:flex shadow-sm gap-2 border border-border/50 bg-card/60 hover:bg-muted font-medium text-foreground">
                        <Link href="/dashboard/omnichannel/reasoning">
                            <Activity className="h-4 w-4 text-primary" />
                            Live Reasoning
                        </Link>
                    </Button>

                    <Button onClick={() => setIsAddDialogOpen(true)} className="shadow-sm">
                        <Plus className="mr-2 h-4 w-4" />
                        Add Channel
                    </Button>

                    <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                        <DialogContent className="sm:max-w-[425px] p-0 border-none bg-transparent">
                            <VisuallyHidden>
                                <DialogTitle>Add New Channel</DialogTitle>
                                <DialogDescription>
                                    Connect a new messaging platform to your bot.
                                </DialogDescription>
                            </VisuallyHidden>
                            <ChannelConnectionForm
                                type={selectedPlatform}
                                onSuccess={() => setIsAddDialogOpen(false)}
                                onCancel={() => setIsAddDialogOpen(false)}
                            />
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            {channels.length === 0 && !isLoading ? (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 w-full max-w-6xl mx-auto">
                    {PLATFORMS.map(p => (
                        <button
                            key={p.id}
                            onClick={() => { setSelectedPlatform(p.id); setIsAddDialogOpen(true); }}
                            className="flex flex-col items-center justify-center rounded-xl border border-border bg-card/50 p-6 transition-all hover:bg-muted/50 hover:border-primary/50 hover:shadow-md group backdrop-blur-md min-h-[160px]"
                        >
                            <div className={cn("rounded-full p-4 mb-4 group-hover:scale-110 transition-transform bg-opacity-10", p.bgColor + '/10')}>
                                <p.Icon className={cn("h-8 w-8", p.textColor)} />
                            </div>
                            <span className="font-medium text-foreground">{p.label}</span>
                        </button>
                    ))}
                </div>
            ) : (
                <div className="flex flex-col lg:flex-row gap-8">
                    <div className="flex-1 grid gap-6 md:grid-cols-2 auto-rows-min">
                        {channels.map((channel) => (
                            <ChannelCard key={channel.id} channel={channel} />
                        ))}
                    </div>

                    <div className="w-full lg:w-72 shrink-0 space-y-4">
                        <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                            <Plus className="h-5 w-5 text-primary" />
                            Add Platform
                        </h3>
                        <div className="grid grid-cols-2 lg:grid-cols-1 gap-3">
                            {PLATFORMS.map(p => (
                                <button
                                    key={p.id}
                                    onClick={() => { setSelectedPlatform(p.id); setIsAddDialogOpen(true); }}
                                    className="flex items-center gap-3 p-3 rounded-xl border border-border bg-card/40 backdrop-blur-sm transition-all hover:bg-muted/50 hover:border-primary/30 group"
                                >
                                    <div className={cn("rounded-lg p-2 bg-opacity-10", p.bgColor + '/10')}>
                                        <p.Icon className={cn("h-4 w-4", p.textColor)} />
                                    </div>
                                    <span className="text-sm font-medium">{p.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            <ActivityFeed />
        </div>
    );
}
