'use client';

import { useEffect, useState } from 'react';
import {
    Slack,
    LayoutGrid,
    Plus,
    Activity,
    Wifi,
    WifiOff,
    Settings2,
    RefreshCw,
    AlertCircle,
    Smartphone,
    MessageSquare,
    Hash
} from 'lucide-react';
import { SiWhatsapp, SiTelegram, SiDiscord, SiSignal, SiGooglechat } from 'react-icons/si';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useOmnichannelStore } from '@/stores/useOmnichannelStore';
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ChannelConnectionForm } from '@/components/omnichannel/ChannelConnectionForm';
import { ChannelProgressStepper } from './ChannelProgressStepper';
import { OmnichannelSocketManager } from './OmnichannelSocketManager';
import { ActivityFeed } from './ActivityFeed';

// Helper for accessibility
const VisuallyHidden = ({ children }: { children: React.ReactNode }) => (
    <span className="absolute w-[1px] h-[1px] p-0 -m-[1px] overflow-hidden clip-[rect(0,0,0,0)] whitespace-nowrap border-0">
        {children}
    </span>
);

const ICON_MAP = {
    whatsapp: SiWhatsapp,
    telegram: SiTelegram,
    discord: SiDiscord,
    slack: Slack,
    signal: SiSignal,
    imessage: MessageSquare,
    irc: Hash,
    googlechat: SiGooglechat
};

const COLOR_MAP = {
    whatsapp: 'bg-green-500',
    telegram: 'bg-blue-400',
    discord: 'bg-indigo-500',
    slack: 'bg-purple-500',
    signal: 'bg-blue-600',
    imessage: 'bg-blue-400',
    irc: 'bg-gray-500',
    googlechat: 'bg-yellow-500'
};

function ChannelCard({ channel }: { channel: any }) {
    const Icon = ICON_MAP[channel.type as keyof typeof ICON_MAP] || MessageSquare;
    const color = COLOR_MAP[channel.type as keyof typeof COLOR_MAP] || 'bg-primary';

    const isConnecting = channel.status === 'connecting' || channel.status === 'initializing';

    return (
        <Card className="overflow-hidden border-border/50 bg-card/40 backdrop-blur-md transition-all hover:shadow-md h-full flex flex-col">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="flex items-center space-x-2">
                    <div className={cn("rounded-lg p-2 text-white", color)}>
                        <Icon className="h-5 w-5" />
                    </div>
                    <div>
                        <CardTitle className="text-lg">{channel.name}</CardTitle>
                        <CardDescription>{channel.account || 'Not configured'}</CardDescription>
                    </div>
                </div>
                <Badge variant={
                    channel.status === 'connected' ? 'default' :
                        channel.status === 'error' ? 'destructive' :
                            'secondary'
                } className="capitalize">
                    {channel.status}
                </Badge>
            </CardHeader>
            <CardContent className="pt-4 flex-1">
                {isConnecting ? (
                    <ChannelProgressStepper
                        currentStep="Starting Connection"
                        status="in_progress"
                    />
                ) : (
                    <div className="flex items-center text-sm text-muted-foreground">
                        {channel.status === 'connected' ? (
                            <Wifi className="mr-2 h-4 w-4 text-green-500" />
                        ) : (
                            <WifiOff className="mr-2 h-4 w-4" />
                        )}
                        <span>
                            {channel.status === 'connected' ? 'Bot is active and listening' : 'Bot is currently offline'}
                        </span>
                    </div>
                )}
            </CardContent>
            <CardFooter className="bg-muted/30 border-t border-border/50 py-3 mt-auto">
                <Button variant="ghost" size="sm" className="w-full justify-between font-normal">
                    <span>Manage connection</span>
                    <Settings2 className="h-4 w-4" />
                </Button>
            </CardFooter>
        </Card>
    );
}

type Platform = 'whatsapp' | 'telegram' | 'discord' | 'slack' | 'signal' | 'imessage' | 'irc' | 'googlechat';

export default function OmnichannelHubPage() {
    const { channels, activity, isLoading, fetchAllChannels } = useOmnichannelStore();
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [selectedPlatform, setSelectedPlatform] = useState<Platform>('whatsapp');

    useEffect(() => {
        fetchAllChannels();
    }, [fetchAllChannels]);

    const PLATFORMS: Array<{id: Platform, label: string, icon: any, color: string}> = [
        { id: 'whatsapp', label: 'WhatsApp', icon: SiWhatsapp, color: 'text-green-500' },
        { id: 'telegram', label: 'Telegram', icon: SiTelegram, color: 'text-blue-400' },
        { id: 'discord', label: 'Discord', icon: SiDiscord, color: 'text-indigo-500' },
        { id: 'slack', label: 'Slack', icon: Slack, color: 'text-purple-500' },
        { id: 'signal', label: 'Signal', icon: SiSignal, color: 'text-blue-600' },
        { id: 'googlechat', label: 'Google Chat', icon: SiGooglechat, color: 'text-yellow-500' },
        { id: 'irc', label: 'IRC', icon: Hash, color: 'text-gray-500' },
        { id: 'imessage', label: 'iMessage', icon: MessageSquare, color: 'text-blue-400' },
    ];

    return (
        <div className="space-y-8">
            <OmnichannelSocketManager />

            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-foreground font-foreground">Omnichannel Hub</h2>
                    <p className="text-muted-foreground">
                        Central command for all your social messaging platforms.
                    </p>
                </div>
                <div className="flex space-x-2">
                    <Button variant="outline" size="icon" onClick={() => fetchAllChannels()} disabled={isLoading}>
                        <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
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
                            <div className={cn("rounded-full p-4 mb-4 group-hover:scale-110 transition-transform bg-opacity-10", p.color.replace('text-', 'bg-') + '/10')}>
                                <p.icon className={cn("h-8 w-8", p.color)} />
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
                                    <div className={cn("rounded-lg p-2 bg-opacity-10", p.color.replace('text-', 'bg-') + '/10')}>
                                        <p.icon className={cn("h-4 w-4", p.color)} />
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
