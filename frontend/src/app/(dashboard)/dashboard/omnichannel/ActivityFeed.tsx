'use client';

import { useState } from 'react';
import { Activity, MessageSquare, Send, Hash, Slack, Smartphone, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { useOmnichannelStore } from '@/stores/useOmnichannelStore';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

const ICON_MAP = {
    whatsapp: MessageSquare,
    telegram: Send,
    discord: Hash,
    slack: Slack,
    signal: Smartphone,
    system: Settings
};

export function ActivityFeed() {
    const { activity } = useOmnichannelStore();
    const [filter, setFilter] = useState('all');

    const filteredActivity = filter === 'all' 
        ? activity 
        : activity.filter(event => event.channel.toLowerCase() === filter);

    return (
        <div className="rounded-xl border border-border/50 bg-card p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                    <h3 className="text-lg font-semibold">Channel Activity</h3>
                    <p className="text-sm text-muted-foreground">Combined real-time stream from all connected platforms.</p>
                </div>
                
                <div className="flex items-center space-x-4">
                    <Tabs value={filter} onValueChange={setFilter} className="w-auto">
                        <TabsList className="bg-muted/50">
                            <TabsTrigger value="all" className="text-xs px-2 py-1">All</TabsTrigger>
                            <TabsTrigger value="whatsapp" className="text-xs px-2 py-1">WA</TabsTrigger>
                            <TabsTrigger value="telegram" className="text-xs px-2 py-1">TG</TabsTrigger>
                            <TabsTrigger value="discord" className="text-xs px-2 py-1">DC</TabsTrigger>
                        </TabsList>
                    </Tabs>
                    
                    <Badge variant="outline" className="font-mono shrink-0">
                        <Activity className="mr-1 h-3 w-3 text-green-500 animate-pulse" />
                        LIVE
                    </Badge>
                </div>
            </div>
            
            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar min-h-[200px]">
                {filteredActivity.length === 0 ? (
                    <div className="flex h-[200px] flex-col items-center justify-center rounded-lg border border-dashed text-center">
                        <Activity className="h-8 w-8 text-muted-foreground/20 mb-2" />
                        <p className="text-sm text-muted-foreground">
                            {filter === 'all' 
                                ? 'Activity logs will appear here as messages flow through the gateway.' 
                                : `No recent activity for ${filter}.`}
                        </p>
                    </div>
                ) : (
                    filteredActivity.map((event) => {
                        const Icon = ICON_MAP[event.channel.toLowerCase() as keyof typeof ICON_MAP] || Activity;
                        return (
                            <div key={event.id} className="flex items-start space-x-3 rounded-lg border border-border/50 bg-muted/20 p-3 text-sm transition-all hover:bg-muted/30">
                                <div className={cn(
                                    "mt-0.5 rounded-full p-1.5",
                                    event.type === 'inbound' ? "bg-blue-500/10 text-blue-500" :
                                    event.type === 'outbound' ? "bg-green-500/10 text-green-500" :
                                    event.type === 'skill' ? "bg-purple-500/10 text-purple-500" :
                                    "bg-orange-500/10 text-orange-500"
                                )}>
                                    <Icon className="h-3.5 w-3.5" />
                                </div>
                                <div className="flex-1 space-y-1">
                                    <div className="flex items-center justify-between">
                                        <p className="font-medium capitalize text-foreground">{event.channel}</p>
                                        <time className="text-[10px] text-muted-foreground">
                                            {new Date(event.timestamp).toLocaleTimeString()}
                                        </time>
                                    </div>
                                    <p className="text-muted-foreground line-clamp-2">{event.message}</p>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}
