'use client';

import { 
    Cpu, 
    Activity, 
    Zap, 
    ShieldCheck, 
    Clock, 
    Network,
    Terminal,
    Server
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useOmnichannelStore } from '@/stores/useOmnichannelStore';

export function GatewayMetrics() {
    const { gatewayHealth, skillReport, getSkillCount } = useOmnichannelStore();

    const uptime = gatewayHealth?.uptimeMs || 0;
    const hours = Math.floor(uptime / 3600000);
    const minutes = Math.floor((uptime % 3600000) / 60000);
    
    const activeAgents = gatewayHealth?.agents?.length || 0;
    const totalSkills = getSkillCount();
    const presenceCount = gatewayHealth?.snapshot?.presenceCount || 0;

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card className="border-border/40 bg-card/60 backdrop-blur-sm group hover:border-primary/30 transition-all">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Gateway Status</CardTitle>
                    <Activity className={cn(
                        "h-4 w-4",
                        uptime > 0 ? "text-green-500 animate-pulse" : "text-muted-foreground"
                    )} />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-black">{uptime > 0 ? 'OPERATIONAL' : 'OFFLINE'}</div>
                    <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        Uptime: {hours}h {minutes}m
                    </p>
                </CardContent>
            </Card>

            <Card className="border-border/40 bg-card/60 backdrop-blur-sm group hover:border-blue-500/30 transition-all">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Active Agents</CardTitle>
                    <Server className="h-4 w-4 text-blue-500" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-black">{activeAgents} INSTANCES</div>
                    <div className="mt-2 h-1.5 w-full bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500" style={{ width: `${Math.min(activeAgents * 10, 100)}%` }} />
                    </div>
                </CardContent>
            </Card>

            <Card className="border-border/40 bg-card/60 backdrop-blur-sm group hover:border-purple-500/30 transition-all">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Live Skills</CardTitle>
                    <Zap className="h-4 w-4 text-purple-500" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-black">{totalSkills} TOOLS</div>
                    <p className="text-xs text-muted-foreground mt-1">
                        {skillReport?.skills?.filter(s => !s.disabled).length || 0} enabled globally
                    </p>
                </CardContent>
            </Card>

            <Card className="border-border/40 bg-card/60 backdrop-blur-sm group hover:border-emerald-500/30 transition-all">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Swarm Presence</CardTitle>
                    <Network className="h-4 w-4 text-emerald-500" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-black">{presenceCount} NODES</div>
                    <p className="text-xs text-muted-foreground mt-1">
                        Connected to the mesh
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
