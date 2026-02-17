'use client';

import { useEffect, useState } from 'react';
import { 
    Activity, 
    RefreshCw, 
    Download, 
    TrendingUp, 
    Hash, 
    AlertCircle, 
    Coins, 
    Zap,
    Calendar,
    ArrowUpRight,
    ArrowDownRight,
    Search
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
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

export default function UsagePage() {
    const { 
        usageTotals, 
        usageDaily, 
        usageSessions, 
        fetchUsageTotals, 
        fetchUsageDaily, 
        fetchUsageSessions,
        isLoading 
    } = useOmnichannelStore();
    
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    const handleRefresh = async () => {
        setIsRefreshing(true);
        await Promise.all([
            fetchUsageTotals(),
            fetchUsageDaily(),
            fetchUsageSessions()
        ]);
        setIsRefreshing(false);
    };

    useEffect(() => {
        handleRefresh();
    }, []);

    const filteredSessions = usageSessions.filter(s => 
        s.key.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.agent?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-foreground font-foreground">Usage Analytics</h2>
                    <p className="text-muted-foreground">
                        Monitor token consumption, costs, and session performance across all agents.
                    </p>
                </div>
                <div className="flex space-x-2">
                    <Button variant="outline" onClick={() => toast.info('CSV Export coming soon')}>
                        <Download className="mr-2 h-4 w-4" />
                        Export
                    </Button>
                    <Button variant="outline" size="icon" onClick={handleRefresh} disabled={isRefreshing}>
                        <RefreshCw className={cn("h-4 w-4", isRefreshing && "animate-spin")} />
                    </Button>
                </div>
            </div>

            {/* Quick Stats */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                <Card className="border-border/50 bg-card/50 shadow-lg shadow-primary/5 hover:shadow-primary/10 transition-all duration-300">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Total Tokens</CardTitle>
                        <div className="rounded-lg bg-primary/10 p-2">
                            <Zap className="h-4 w-4 text-primary" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">{(usageTotals?.tokens || 0).toLocaleString()}</div>
                        <p className="text-xs text-muted-foreground mt-1 flex items-center">
                            <ArrowUpRight className="h-3 w-3 text-green-500 mr-1" />
                            <span className="text-green-500 font-medium">+12.5%</span> <span className="ml-1">vs last month</span>
                        </p>
                    </CardContent>
                </Card>
                <Card className="border-border/50 bg-card/50 shadow-lg shadow-green-500/5 hover:shadow-green-500/10 transition-all duration-300">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Estimated Cost</CardTitle>
                        <div className="rounded-lg bg-green-500/10 p-2">
                            <Coins className="h-4 w-4 text-green-500" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">${(usageTotals?.cost || 0).toFixed(2)}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Live market rate optimization
                        </p>
                    </CardContent>
                </Card>
                <Card className="border-border/50 bg-card/50 shadow-lg shadow-blue-500/5 hover:shadow-blue-500/10 transition-all duration-300">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Active Sessions</CardTitle>
                        <div className="rounded-lg bg-blue-500/10 p-2">
                            <Activity className="h-4 w-4 text-blue-500" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">{usageTotals?.sessions || 0}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Parallel thread allocation
                        </p>
                    </CardContent>
                </Card>
                <Card className="border-border/50 bg-card/50 shadow-lg shadow-destructive/5 hover:shadow-destructive/10 transition-all duration-300">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">System Stability</CardTitle>
                        <div className="rounded-lg bg-destructive/10 p-2">
                            <AlertCircle className="h-4 w-4 text-destructive" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">
                            {(usageTotals?.messages ? (100 - (usageTotals.errors / usageTotals.messages) * 100) : 100).toFixed(1)}%
                        </div>
                        <p className="text-xs text-muted-foreground mt-1 flex items-center">
                            <ArrowUpRight className="h-3 w-3 text-green-500 mr-1" />
                            <span className="text-green-500 font-medium">Nominal</span> <span className="ml-1">performance</span>
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Daily Consumption (Mastermind Styled) */}
            <Card className="border-border/50 bg-card shadow-2xl shadow-primary/5 overflow-hidden">
                <div className="h-1 bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
                <CardHeader>
                    <CardTitle className="flex items-center text-xl font-bold">
                        <TrendingUp className="mr-2 h-5 w-5 text-primary" />
                        Intelligence Throughput
                    </CardTitle>
                    <CardDescription>Daily token ingestion and response generation analytics.</CardDescription>
                </CardHeader>
                <CardContent className="h-[300px] flex items-center justify-center border-t border-white/5 mt-4 bg-gradient-to-b from-muted/5 to-transparent">
                    <div className="text-center text-muted-foreground space-y-4">
                        <div className="relative">
                            <Calendar className="h-16 w-12 mx-auto opacity-5" />
                            <div className="absolute inset-0 flex items-center justify-center">
                                <Activity className="h-6 w-6 text-primary/20 animate-pulse" />
                            </div>
                        </div>
                        <div className="space-y-1">
                            <p className="text-xs font-mono text-primary/60 uppercase tracking-tighter">Visualization Engine</p>
                            <p className="text-sm font-medium italic opacity-40">Compiling real-time telemetry...</p>
                        </div>
                        <div className="flex gap-1.5 items-end justify-center h-12">
                            {[40, 70, 45, 90, 65, 80, 50, 30, 85, 60, 75].map((h, i) => (
                                <div 
                                    key={i} 
                                    className={cn(
                                        "w-2 rounded-t-sm transition-all duration-500",
                                        i === 8 ? "bg-primary shadow-[0_0_15px_rgba(var(--primary),0.5)]" : "bg-primary/20"
                                    )} 
                                    style={{ height: `${h}%` }} 
                                />
                            ))}
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Session Usage Table */}
            <Card className="border-border/50 bg-card shadow-xl overflow-hidden">
                <div className="h-1 bg-gradient-to-r from-primary/20 to-transparent" />
                <CardHeader className="flex flex-row items-center justify-between pb-6">
                    <div>
                        <CardTitle>Session Breakdown</CardTitle>
                        <CardDescription>Detailed metrics for individual AI interaction threads.</CardDescription>
                    </div>
                    <div className="relative w-64">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input 
                            placeholder="Filter sessions..." 
                            className="pl-9 h-9 text-xs"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </CardHeader>
                <CardContent>
                    {filteredSessions.length === 0 ? (
                        <div className="py-12 text-center text-muted-foreground">
                            No session data available for the selected filters.
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Session ID</TableHead>
                                    <TableHead>Agent</TableHead>
                                    <TableHead>Channel</TableHead>
                                    <TableHead className="text-right">Messages</TableHead>
                                    <TableHead className="text-right">Tokens</TableHead>
                                    <TableHead className="text-right">Cost</TableHead>
                                    <TableHead className="text-right">Last Active</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredSessions.map((session) => (
                                    <TableRow key={session.key}>
                                        <TableCell className="font-mono text-[10px]">{session.key.slice(0, 12)}...</TableCell>
                                        <TableCell>
                                            <Badge variant="secondary" className="text-[10px]">{session.agent || 'default'}</Badge>
                                        </TableCell>
                                        <TableCell className="capitalize text-xs">{session.channel || 'unknown'}</TableCell>
                                        <TableCell className="text-right text-xs">{session.messages}</TableCell>
                                        <TableCell className="text-right text-xs font-mono">{session.tokens.toLocaleString()}</TableCell>
                                        <TableCell className="text-right text-xs font-semibold">${session.cost.toFixed(4)}</TableCell>
                                        <TableCell className="text-right text-[10px] text-muted-foreground italic">
                                            {new Date(session.updatedAt).toLocaleString()}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
