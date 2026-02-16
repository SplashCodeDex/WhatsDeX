import { Suspense } from 'react';
import { Metadata } from 'next';
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

export const metadata: Metadata = {
    title: 'Omnichannel Hub',
    description: 'Manage your bot connections across multiple platforms',
};

interface ChannelCardProps {
    id: string;
    name: string;
    type: 'whatsapp' | 'telegram' | 'discord' | 'slack' | 'signal';
    status: 'connected' | 'disconnected' | 'connecting' | 'error';
    account?: string;
    icon: React.ElementType;
    color: string;
}

const CHANNELS: ChannelCardProps[] = [
    {
        id: '1',
        name: 'WhatsApp Business',
        type: 'whatsapp',
        status: 'connected',
        account: '+233 24 123 4567',
        icon: MessageSquare,
        color: 'bg-green-500',
    },
    {
        id: '2',
        name: 'Telegram Support Bot',
        type: 'telegram',
        status: 'disconnected',
        account: '@WhatsDeX_Bot',
        icon: Send,
        color: 'bg-blue-400',
    },
    {
        id: '3',
        name: 'Discord Community',
        type: 'discord',
        status: 'error',
        account: 'CodeDeX Server',
        icon: Hash,
        color: 'bg-indigo-500',
    },
    {
        id: '4',
        name: 'Slack Notifications',
        type: 'slack',
        status: 'connecting',
        account: 'Engineering Workspace',
        icon: Slack,
        color: 'bg-purple-500',
    }
];

function ChannelCard({ name, status, account, icon: Icon, color }: ChannelCardProps) {
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
                    status === 'connected' ? 'success' :
                    status === 'error' ? 'destructive' :
                    'secondary'
                } className="capitalize">
                    {status}
                </Badge>
            </CardHeader>
            <CardContent className="pt-4">
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

export default function OmnichannelHubPage() {
    return (
        <div className="space-y-8">
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
                {CHANNELS.map((channel) => (
                    <ChannelCard key={channel.id} {...channel} />
                ))}
                
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
                <div className="flex h-[200px] items-center justify-center rounded-lg border border-dashed text-center">
                    <p className="text-sm text-muted-foreground">Activity logs will appear here as messages flow through the gateway.</p>
                </div>
            </div>
        </div>
    );
}
