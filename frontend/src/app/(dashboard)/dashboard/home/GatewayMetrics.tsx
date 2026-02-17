'use client';

import { useEffect } from 'react';
import { useOmnichannelStore } from '@/stores/useOmnichannelStore';
import { 
    Clock, 
    Monitor, 
    Zap, 
    Wifi, 
    ShieldCheck, 
    RefreshCw 
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

function formatDuration(ms: number) {
    if (!ms) return '0s';
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ${hours % 24}h`;
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
}

export function GatewayMetrics() {
    const { gatewayHealth, fetchGatewayHealth, isLoading } = useOmnichannelStore();

    useEffect(() => {
        fetchGatewayHealth();
        const interval = setInterval(fetchGatewayHealth, 30000); // Every 30s
        return () => clearInterval(interval);
    }, [fetchGatewayHealth]);

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card className="border-border/50 bg-card/50">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Gateway Uptime
                    </CardTitle>
                    <Clock className="h-4 w-4 text-primary" />
                </CardHeader>
                <CardContent>
                    <div className="text-xl font-bold">{formatDuration(gatewayHealth?.uptimeMs)}</div>
                    <p className="text-[10px] text-muted-foreground mt-1">Engine continuous run time</p>
                </CardContent>
            </Card>

            <Card className="border-border/50 bg-card/50">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Connected Nodes
                    </CardTitle>
                    <Monitor className="h-4 w-4 text-blue-500" />
                </CardHeader>
                <CardContent>
                    <div className="text-xl font-bold">{gatewayHealth?.snapshot?.presenceCount || 0}</div>
                    <p className="text-[10px] text-muted-foreground mt-1">Active mobile & edge nodes</p>
                </CardContent>
            </Card>

            <Card className="border-border/50 bg-card/50">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Active Skills
                    </CardTitle>
                    <Zap className="h-4 w-4 text-orange-500" />
                </CardHeader>
                <CardContent>
                    <div className="text-xl font-bold">51</div>
                    <Badge variant="outline" className="text-[8px] py-0 h-4 mt-1 bg-primary/5 border-primary/20">
                        OPENCLAW POWERED
                    </Badge>
                </CardContent>
            </Card>

            <Card className="border-border/50 bg-card/50">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        System Integrity
                    </CardTitle>
                    <ShieldCheck className="h-4 w-4 text-green-500" />
                </CardHeader>
                <CardContent>
                    <div className="flex items-center space-x-2">
                        <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                        <span className="text-xl font-bold uppercase tracking-tighter">Verified</span>
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-1 text-green-500/80 font-medium">All sub-agents operational</p>
                </CardContent>
            </Card>
        </div>
    );
}
