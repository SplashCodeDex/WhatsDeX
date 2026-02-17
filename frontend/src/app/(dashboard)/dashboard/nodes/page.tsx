'use client';

import { useEffect, useState } from 'react';
import { 
    Monitor, 
    RefreshCw, 
    Smartphone, 
    ShieldCheck, 
    ShieldAlert, 
    Plus,
    CheckCircle2,
    XCircle,
    Power,
    Settings2,
    Cpu,
    ExternalLink
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useOmnichannelStore } from '@/stores/useOmnichannelStore';
import { toast } from 'sonner';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';

export default function NodesPage() {
    const { 
        nodes, 
        devices, 
        fetchNodes, 
        fetchDevices, 
        approveDevice, 
        rejectDevice,
        isLoading 
    } = useOmnichannelStore();
    
    const [isRefreshing, setIsRefreshing] = useState(false);

    const handleRefresh = async () => {
        setIsRefreshing(true);
        await Promise.all([fetchNodes(), fetchDevices()]);
        setIsRefreshing(false);
    };

    useEffect(() => {
        handleRefresh();
    }, []);

    const handleApprove = async (id: string) => {
        const success = await approveDevice(id);
        if (success) toast.success('Device request approved');
    };

    const handleReject = async (id: string) => {
        const success = await rejectDevice(id);
        if (success) toast.success('Device request rejected');
    };

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-foreground font-foreground">Infrastructure Nodes</h2>
                    <p className="text-muted-foreground">
                        Manage paired mobile devices, edge nodes, and execution capabilities.
                    </p>
                </div>
                <div className="flex space-x-2">
                    <Button variant="outline" size="icon" onClick={handleRefresh} disabled={isRefreshing}>
                        <RefreshCw className={cn("h-4 w-4", isRefreshing && "animate-spin")} />
                    </Button>
                </div>
            </div>

            {/* Pending Devices */}
            {(devices?.pending.length || 0) > 0 && (
                <Card className="border-orange-500/50 bg-orange-500/5 shadow-2xl shadow-orange-500/10 overflow-hidden relative">
                    <div className="absolute top-0 left-0 w-1 h-full bg-orange-500" />
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle className="text-orange-500 flex items-center text-xl font-black italic tracking-tighter">
                                <ShieldAlert className="mr-2 h-6 w-6 animate-bounce" />
                                INTRUSION ATTEMPT / PAIRING REQUEST
                            </CardTitle>
                            <CardDescription className="text-orange-500/70 font-medium">
                                External hardware requesting master-slave linkage to your bot core.
                            </CardDescription>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {devices?.pending.map((device) => (
                                <div key={device.requestId} className="flex items-center justify-between rounded-lg border border-orange-500/20 bg-orange-500/10 p-4 backdrop-blur-sm">
                                    <div className="flex items-center space-x-4">
                                        <div className="rounded-xl bg-orange-500/20 p-3 border border-orange-500/30">
                                            <Smartphone className="h-6 w-6 text-orange-500" />
                                        </div>
                                        <div>
                                            <p className="text-base font-bold text-orange-600">{device.name}</p>
                                            <p className="text-[10px] font-mono text-orange-500/60">{device.deviceId}</p>
                                            <div className="flex items-center space-x-2 mt-1">
                                                <Badge className="bg-orange-500 hover:bg-orange-500 text-[9px] h-4 px-1.5">{device.role}</Badge>
                                                <span className="text-[9px] text-orange-500/50 font-mono">REQ_ID: {device.requestId.slice(0, 8)}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex space-x-2">
                                        <Button size="sm" variant="ghost" className="text-orange-500 hover:bg-orange-500/10" onClick={() => handleReject(device.requestId)}>
                                            <XCircle className="mr-2 h-4 w-4" />
                                            Deny
                                        </Button>
                                        <Button size="sm" className="bg-orange-500 hover:bg-orange-600 text-white border-none shadow-lg shadow-orange-500/20" onClick={() => handleApprove(device.requestId)}>
                                            <ShieldCheck className="mr-2 h-4 w-4" />
                                            Authorize
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            <div className="grid gap-6 md:grid-cols-2">
                {/* Active Nodes */}
                <Card className="border-border/50 bg-card/50 shadow-xl overflow-hidden relative group">
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    <CardHeader className="relative z-10">
                        <CardTitle className="flex items-center text-lg font-bold">
                            <Cpu className="mr-2 h-5 w-5 text-primary animate-pulse" />
                            Compute Nodes
                        </CardTitle>
                        <CardDescription>Remote execution units contributing to the swarm.</CardDescription>
                    </CardHeader>
                    <CardContent className="relative z-10">
                        {nodes.length === 0 ? (
                            <div className="py-12 text-center text-muted-foreground italic text-sm border border-dashed rounded-xl">
                                No active compute units detected.
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {nodes.map((node) => (
                                    <div key={node.nodeId} className="group/node relative rounded-xl border border-white/5 bg-muted/30 p-4 transition-all hover:bg-muted/50 hover:border-primary/20">
                                        <div className="flex items-start justify-between">
                                            <div className="flex items-center space-x-3">
                                                <div className={cn(
                                                    "rounded-lg p-2.5 transition-colors",
                                                    node.connected ? "bg-green-500/10 text-green-500 shadow-[0_0_10px_rgba(34,197,94,0.2)]" : "bg-muted text-muted-foreground"
                                                )}>
                                                    <Monitor className="h-5 w-5" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold tracking-tight">{node.name || 'Anonymous Node'}</p>
                                                    <p className="text-[10px] text-muted-foreground font-mono uppercase tracking-tighter">{node.platform} Â· v{node.version}</p>
                                                </div>
                                            </div>
                                            <Badge variant={node.connected ? 'default' : 'secondary'} className={cn(
                                                "text-[8px] uppercase tracking-widest px-1.5 h-4",
                                                node.connected && "bg-green-500/20 text-green-500 border-green-500/30 hover:bg-green-500/20"
                                            )}>
                                                {node.connected ? 'STABLE' : 'OFFLINE'}
                                            </Badge>
                                        </div>
                                        <div className="mt-4 flex flex-wrap gap-1.5">
                                            {node.capabilities.map(cap => (
                                                <Badge key={cap} variant="outline" className="text-[9px] py-0 h-4 border-primary/10 text-primary/60 bg-primary/5">
                                                    {cap}
                                                </Badge>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Paired Devices */}
                <Card className="border-border/50 bg-card/50 shadow-xl overflow-hidden relative">
                    <CardHeader>
                        <CardTitle className="flex items-center text-lg font-bold">
                            <ShieldCheck className="mr-2 h-5 w-5 text-green-500" />
                            Authorized Hardware
                        </CardTitle>
                        <CardDescription>Verified physical endpoints with master clearance.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {(!devices?.paired.length) ? (
                            <div className="py-12 text-center text-muted-foreground italic text-sm border border-dashed rounded-xl">
                                No security clearances issued.
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {devices.paired.map((device) => (
                                    <div key={device.deviceId} className="flex items-center justify-between rounded-xl border border-white/5 bg-muted/20 p-3 hover:bg-muted/40 transition-colors">
                                        <div className="flex items-center space-x-3">
                                            <div className="p-2 rounded-lg bg-background border border-white/5">
                                                <Smartphone className="h-4 w-4 text-muted-foreground" />
                                            </div>
                                            <div>
                                                <p className="text-xs font-bold uppercase tracking-tight">{device.name || 'Personal Proxy'}</p>
                                                <div className="flex items-center space-x-2 mt-0.5">
                                                    <Badge variant="secondary" className="text-[8px] h-3.5 px-1.5 bg-green-500/10 text-green-500 border-green-500/20">{device.role}</Badge>
                                                    <span className="text-[9px] text-muted-foreground font-mono">EST: {new Date(device.pairedAt).toLocaleDateString()}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10">
                                            <Power className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                    <CardFooter className="bg-muted/30 border-t py-4">
                        <Button variant="outline" className="w-full text-xs h-9 border-dashed border-primary/30 hover:border-primary/50 hover:bg-primary/5 text-primary/70" disabled>
                            <Plus className="mr-2 h-4 w-4" />
                            Issue New Pairing Token
                        </Button>
                    </CardFooter>
                </Card>
            </div>
        </div>
    );
}
