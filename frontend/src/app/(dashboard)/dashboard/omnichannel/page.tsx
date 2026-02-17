'use client';

import { useEffect, useState } from 'react';
import {
    MessageSquare,
    Send,
    Hash,
    Slack,
    LayoutGrid,
    Plus,
    Activity,
    Wifi,
    WifiOff,
    Settings2,
    RefreshCw,
    AlertCircle,
    Smartphone
} from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useOmnichannelStore } from '@/stores/useOmnichannelStore';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { ChannelConnectionForm } from '@/components/omnichannel/ChannelConnectionForm';
import { ChannelProgressStepper } from './ChannelProgressStepper';
import { OmnichannelSocketManager } from './OmnichannelSocketManager';

const ICON_MAP = {
    whatsapp: MessageSquare,
    telegram: Send,
    discord: Hash,
    slack: Slack,
    signal: Smartphone
};

const COLOR_MAP = {
    whatsapp: 'bg-green-500',
    telegram: 'bg-blue-400',
    discord: 'bg-indigo-500',
    slack: 'bg-purple-500',
    signal: 'bg-teal-500'
};

function ChannelCard({ channel }: { channel: any }) {
    const Icon = ICON_MAP[channel.type as keyof typeof ICON_MAP] || MessageSquare;
    const color = COLOR_MAP[channel.type as keyof typeof COLOR_MAP] || 'bg-primary';
    
    const isConnecting = channel.status === 'connecting' || channel.status === 'initializing';

    return (
        <Card className="overflow-hidden border-border/50 bg-card transition-all hover:shadow-md h-full flex flex-col">
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
                    channel.status === 'connected' ? 'success' :
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

export default function OmnichannelHubPage() {
    const { channels, activity, isLoading, fetchChannels } = useOmnichannelStore();
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [selectedPlatform, setSelectedSelectedPlatform] = useState<'telegram' | 'discord' | 'slack'>('telegram');

    useEffect(() => {
        fetchChannels();
    }, [fetchChannels]);

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
                    <Button variant="outline" size="icon" onClick={() => fetchChannels()} disabled={isLoading}>
                        <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
                    </Button>
                    
                    <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                        <DialogContent className="sm:max-w-[425px] p-0 border-none bg-transparent">
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
                <div className="flex h-[300px] flex-col items-center justify-center rounded-xl border-2 border-dashed border-border p-12 text-center bg-card">
                    <div className="rounded-full bg-primary/10 p-4 text-primary">
                        <LayoutGrid className="h-8 w-8" />
                    </div>
                    <h3 className="mt-4 text-xl font-semibold">No channels connected</h3>
                    <p className="mb-6 mt-2 text-muted-foreground max-w-sm">
                        Start by connecting your WhatsApp, Telegram, or Discord bot to unify your messaging.
                    </p>
                    <div className="flex gap-3">
                        <Button onClick={() => { setSelectedSelectedPlatform('telegram'); setIsAddDialogOpen(true); }}>
                            <Send className="mr-2 h-4 w-4" />
                            Telegram
                        </Button>
                        <Button variant="outline" onClick={() => { setSelectedSelectedPlatform('discord'); setIsAddDialogOpen(true); }}>
                            <Hash className="mr-2 h-4 w-4" />
                            Discord
                        </Button>
                    </div>
                </div>
            ) : (
                <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3 auto-rows-fr">
                    {channels.map((channel) => (
                        <ChannelCard key={channel.id} channel={channel} />
                    ))}
                    
                    <div className="flex flex-col gap-4">
                        <button 
                            onClick={() => { setSelectedSelectedPlatform('telegram'); setIsAddDialogOpen(true); }}
                            className="flex-1 flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-border p-6 transition-colors hover:bg-muted/50 hover:border-primary/50 group bg-card"
                        >
                            <div className="rounded-full bg-blue-500/10 p-3 text-blue-500 group-hover:scale-110 transition-transform">
                                <Send className="h-6 w-6" />
                            </div>
                            <span className="mt-2 font-medium">Add Telegram</span>
                        </button>
                        <button 
                            onClick={() => { setSelectedSelectedPlatform('discord'); setIsAddDialogOpen(true); }}
                            className="flex-1 flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-border p-6 transition-colors hover:bg-muted/50 hover:border-primary/50 group bg-card"
                        >
                            <div className="rounded-full bg-indigo-500/10 p-3 text-indigo-500 group-hover:scale-110 transition-transform">
                                <Hash className="h-6 w-6" />
                            </div>
                            <span className="mt-2 font-medium">Add Discord</span>
                        </button>
                    </div>
                </div>
            )}

            <div className="rounded-xl border border-border/50 bg-card p-6 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h3 className="text-lg font-semibold">Channel Activity</h3>
                        <p className="text-sm text-muted-foreground">Combined real-time stream from all connected platforms.</p>
                    </div>
                    <Badge variant="outline" className="font-mono">
                        <Activity className="mr-1 h-3 w-3 text-green-500 animate-pulse" />
                        LIVE
                    </Badge>
                </div>
                
                <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                    {activity.length === 0 ? (
                        <div className="flex h-[200px] items-center justify-center rounded-lg border border-dashed text-center">
                            <p className="text-sm text-muted-foreground">Activity logs will appear here as messages flow through the gateway.</p>
                        </div>
                    ) : (
                        activity.map((event) => (
                            <div key={event.id} className="flex items-start space-x-3 rounded-lg border border-border/50 bg-muted/20 p-3 text-sm transition-all hover:bg-muted/30">
                                <div className={cn(
                                    "mt-0.5 rounded-full p-1",
                                    event.type === 'inbound' ? "bg-blue-500/10 text-blue-500" :
                                    event.type === 'outbound' ? "bg-green-500/10 text-green-500" :
                                    "bg-orange-500/10 text-orange-500"
                                )}>
                                    <Activity className="h-3 w-3" />
                                </div>
                                <div className="flex-1 space-y-1">
                                    <div className="flex items-center justify-between">
                                        <p className="font-medium capitalize text-foreground">{event.channel}</p>
                                        <time className="text-[10px] text-muted-foreground">
                                            {new Date(event.timestamp).toLocaleTimeString()}
                                        </time>
                                    </div>
                                    <p className="text-muted-foreground">{event.message}</p>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
