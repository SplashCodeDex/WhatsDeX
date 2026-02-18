'use client';

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
    Settings2
} from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { OmnichannelSocketManager } from './OmnichannelSocketManager';
import { ChannelProgressStepper } from './ChannelProgressStepper';
import { useOmnichannelStore } from '@/stores/useOmnichannelStore';
import { Channel } from '@/types';

interface ChannelCardProps {
    id: string;
    name: string;
    type: 'whatsapp' | 'telegram' | 'discord' | 'slack' | 'signal';
    status: Channel['status'];
    account?: string | null;
    icon: React.ElementType;
    color: string;
    lastProgress?: Channel['lastProgress'];
}

const TYPE_CONFIG = {
    whatsapp: { icon: MessageSquare, color: 'bg-green-500' },
    telegram: { icon: Send, color: 'bg-blue-400' },
    discord: { icon: Hash, color: 'bg-indigo-500' },
    slack: { icon: Slack, color: 'bg-purple-500' },
    signal: { icon: MessageSquare, color: 'bg-blue-600' }
};

function ChannelCard({ name, status, account, icon: Icon, color, lastProgress }: ChannelCardProps) {
    const isConnecting = status === 'connecting' || status === 'initializing' || status === 'qr_pending';

    return (
        <Card className="overflow-hidden border-border/50 bg-card transition-all hover:shadow-md">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="flex items-center space-x-2">
                    <div className={cn("rounded-lg p-2 text-white", color)}>
                        <Icon className="h-5 w-5" />
                    </div>
                    <div>
                        <CardTitle className="text-lg">{name}</CardTitle>
                        <CardDescription>{account || 'Not configured'}</CardDescription>
                    </div>
                </div>
                <Badge variant={
                    status === 'connected' ? 'default' :
                        status === 'error' ? 'destructive' :
                            'secondary'
                } className={cn("capitalize", status === 'connected' && "bg-green-500 text-white hover:bg-green-600")}>
                    {status}
                </Badge>
            </CardHeader>
            <CardContent className="pt-4">
                {isConnecting && lastProgress ? (
                    <ChannelProgressStepper
                        currentStep={lastProgress.step}
                        status={lastProgress.status}
                    />
                ) : (
                    <div className="flex items-center text-sm text-muted-foreground">
                        {status === 'connected' ? (
                            <Wifi className="mr-2 h-4 w-4 text-green-500" />
                        ) : (
                            <WifiOff className="mr-2 h-4 w-4" />
                        )}
                        <span>
                            {status === 'connected' ? 'Bot is active and listening' : 'Bot is currently offline'}
                        </span>
                    </div>
                )}
            </CardContent>
            <CardFooter className="bg-muted/30 border-t border-border/50 py-3">
                <Button variant="ghost" size="sm" className="w-full justify-between font-normal">
                    <span>Manage connection</span>
                    <Settings2 className="h-4 w-4" />
                </Button>
            </CardFooter>
        </Card>
    );
}

export function OmnichannelHubContent() {
    const { channels, activity, isLoading } = useOmnichannelStore();

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
                <Button className="shadow-sm">
                    <Plus className="mr-2 h-4 w-4" />
                    Add Channel
                </Button>
            </div>

            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                {channels.map((channel) => {
                    const config = TYPE_CONFIG[channel.type as keyof typeof TYPE_CONFIG] || TYPE_CONFIG.whatsapp;
                    return (
                        <ChannelCard
                            key={channel.id}
                            {...channel}
                            account={channel.account || null}
                            icon={config.icon}
                            color={config.color}
                        />
                    );
                })}

                {/* Placeholder for adding new */}
                <button className="flex h-full min-h-[180px] flex-col items-center justify-center rounded-xl border-2 border-dashed border-border p-6 transition-colors hover:bg-muted/50 hover:border-primary/50">
                    <div className="rounded-full bg-primary/10 p-3 text-primary">
                        <LayoutGrid className="h-6 w-6" />
                    </div>
                    <span className="mt-4 font-medium">Add New Platform</span>
                    <p className="text-sm text-muted-foreground mt-1">Telegram, Slack, Discord, and more</p>
                </button>
            </div>

            <div className="rounded-xl border border-border/50 bg-card p-6 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h3 className="text-lg font-semibold">Channel Activity</h3>
                        <p className="text-sm text-muted-foreground text-foreground">Combined real-time stream from all connected platforms.</p>
                    </div>
                    <Badge variant="outline" className="font-mono">
                        <Activity className="mr-1 h-3 w-3 text-green-500 animate-pulse" />
                        LIVE
                    </Badge>
                </div>

                <div className="space-y-4">
                    {activity.length > 0 ? (
                        <div className="max-h-[300px] overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                            {activity.map((event) => (
                                <div key={event.id} className="flex items-center justify-between text-sm p-2 rounded bg-muted/30 border border-border/50">
                                    <div className="flex items-center space-x-2">
                                        <Badge variant="outline" className="text-[10px] uppercase">{event.channel}</Badge>
                                        <span className="font-medium">{event.message}</span>
                                    </div>
                                    <span className="text-muted-foreground text-[10px]">
                                        {new Date(event.timestamp).toLocaleTimeString()}
                                    </span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="flex h-[200px] items-center justify-center rounded-lg border border-dashed text-center">
                            <p className="text-sm text-muted-foreground">Activity logs will appear here as messages flow through the gateway.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
