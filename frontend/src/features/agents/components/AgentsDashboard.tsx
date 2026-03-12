'use client';

import { useEffect, useState } from 'react';
import {
    Bot,
    RefreshCw,
    User,
    Files,
    Settings,
    Wrench,
    Zap,
    Shield,
    ExternalLink,
    ChevronRight,
    Terminal,
    Eye,
    Plus,
    Activity,
    Unlink,
    TrendingUp,
    DollarSign,
    MessageSquare
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useOmnichannelStore } from '@/stores/useOmnichannelStore';
import { useAuth } from '@/features/auth';
import { toast } from 'sonner';
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from '@/components/ui/tabs';
import { TemplateSelector } from '@/features/agents/components/TemplateSelector';
import { ChannelLinker } from '@/features/agents/components/ChannelLinker';
import { SkillToggle } from '@/features/agents/components/SkillToggle';
import { useCreateAgent } from '@/features/agents/hooks/useCreateAgent';
import { AgentTemplate } from '@/features/agents/types';

/**
 * AgentsDashboard Component
 * Core business logic and UI for agent management.
 * Adheres to DeXMart 2026 Rule 8.1 (Thin Page) and Rule 181 (Emoji-Free).
 */
export function AgentsDashboard() {
    const {
        agentsResult,
        agentIdentities,
        usageTotals,
        fetchAgents,
        fetchAgentIdentity,
        fetchUsageTotals,
        disconnectChannel,
        toggleSkill,
        isLoading
    } = useOmnichannelStore();
    const { user } = useAuth();
    const { createAgent, isLoading: isCreating } = useCreateAgent();

    const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [isCreateOpen, setIsCreateOpen] = useState(false);

    const handleRefresh = async () => {
        setIsRefreshing(true);
        try {
            await Promise.all([
                fetchAgents(),
                fetchUsageTotals()
            ]);
        } catch (error) {
            console.error('Refresh failed:', error);
        } finally {
            setIsRefreshing(false);
        }
    };

    const handleCreateAgent = async (template: AgentTemplate) => {
        setIsCreateOpen(false);
        const promise = createAgent({
            name: template.title,
            iconName: template.iconName, // Rule 181: Using iconName
            systemPrompt: template.defaultSystemPrompt || '',
            model: template.suggestedModel || 'gemini-1.5-flash',
        });

        toast.promise(promise, {
            loading: 'Creating agent...',
            success: (result) => {
                if (result.success) {
                    handleRefresh();
                    return `Agent "${template.title}" created successfully!`;
                }
                throw new Error(result.error?.message);
            },
            error: (err) => err.message || 'Failed to create agent',
        });
    };

    const handleToggleSkill = async (skillId: string, enabled: boolean) => {
        if (!selectedAgent) return;

        try {
            const success = await toggleSkill(selectedAgent.id, skillId, enabled);
            if (success) {
                toast.success(`Skill ${enabled ? 'enabled' : 'disabled'} successfully`);
                // Refresh identity to get updated skills
                fetchAgentIdentity(selectedAgent.id);
            } else {
                toast.error(`Failed to ${enabled ? 'enable' : 'disable'} skill`);
            }
        } catch (error) {
            toast.error('Network error while toggling skill');
        }
    };

    const handleAction = async (action: string, id: string) => {
        if (action === 'Unlink' && selectedAgent) {
            const confirmed = window.confirm(`Are you sure you want to unlink this channel from ${selectedAgent.name}?`);
            if (!confirmed) return;

            const success = await disconnectChannel(selectedAgent.id, id);
            if (success) {
                toast.success('Channel unlinked successfully');
                handleRefresh();
                if (currentId) fetchAgentIdentity(currentId);
            } else {
                toast.error('Failed to unlink channel');
            }
        } else {
            toast.info(`${action} requested for ${id}`);
        }
    };

    useEffect(() => {
        handleRefresh();
    }, []);

    const agents = agentsResult?.agents || [];
    const currentId = selectedAgentId || agentsResult?.defaultId || agents[0]?.id;
    const selectedAgent = agents.find(a => a.id === currentId);

    useEffect(() => {
        if (currentId && !agentIdentities[currentId]) {
            fetchAgentIdentity(currentId);
        }
    }, [currentId, agentIdentities, fetchAgentIdentity]);

    const identity = currentId ? agentIdentities[currentId] : null;

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-foreground font-foreground flex items-center">
                        <Activity className="mr-3 h-8 w-8 text-primary" />
                        Agent Orchestration
                    </h2>
                    <p className="text-muted-foreground">
                        Manage your AI agents, their identities, workspaces, and tool access.
                    </p>
                </div>
                <div className="flex space-x-2">
                    <Button onClick={() => setIsCreateOpen(true)}>
                        <Plus className="mr-2 h-4 w-4" />
                        Create Agent
                    </Button>
                    <Button variant="outline" size="icon" onClick={handleRefresh} disabled={isRefreshing}>
                        <RefreshCw className={cn("h-4 w-4", isRefreshing && "animate-spin")} />
                    </Button>
                </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
                {/* Agent Sidebar */}
                <Card className="h-fit border-border/50 bg-card">
                    <CardHeader className="pb-3 border-b border-border/10">
                        <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Active Agents</CardTitle>
                    </CardHeader>
                    <CardContent className="px-2 pt-4">
                        {agents.length === 0 ? (
                            <div className="py-8 text-center text-xs text-muted-foreground italic">
                                No agents configured.
                            </div>
                        ) : (
                            <div className="space-y-1">
                                {agents.map((agent) => {
                                    const isActive = agent.id === currentId;
                                    const agentIdentity = agentIdentities[agent.id];
                                    return (
                                        <button
                                            key={agent.id}
                                            onClick={() => setSelectedAgentId(agent.id)}
                                            className={cn(
                                                "flex w-full items-center space-x-3 rounded-lg px-3 py-2 text-left transition-all duration-200",
                                                isActive
                                                    ? "bg-primary/10 text-primary shadow-sm ring-1 ring-primary/20"
                                                    : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                                            )}
                                        >
                                            <div className={cn(
                                                "flex h-8 w-8 items-center justify-center rounded-lg bg-muted text-foreground transition-colors",
                                                isActive && "bg-primary/20 text-primary"
                                            )}>
                                                <Bot size={16} />
                                            </div>
                                            <div className="flex-1 overflow-hidden">
                                                <div className="truncate text-xs font-semibold">{agentIdentity?.name || agent.name || agent.id}</div>
                                                <div className="truncate text-[10px] opacity-60 font-mono italic">{agent.id}</div>
                                            </div>
                                            {agent.id === agentsResult?.defaultId && (
                                                <Badge variant="outline" className="h-4 px-1 text-[8px] uppercase font-bold bg-primary/5 border-primary/20">Default</Badge>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Agent Detail View */}
                {selectedAgent ? (
                    <div className="space-y-6">
                        <Card className="border-border/50 bg-card overflow-hidden shadow-lg">
                            <div className="h-28 bg-gradient-to-br from-primary/30 via-primary/5 to-transparent relative">
                                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(var(--primary),0.1),transparent)]" />
                            </div>
                            <CardHeader className="relative -mt-14 flex flex-row items-end space-x-6 pb-6 px-8">
                                <div className="flex h-24 w-24 items-center justify-center rounded-2xl bg-card border-4 border-background shadow-[0_8px_30px_rgb(0,0,0,0.12)] text-primary">
                                    <Bot size={48} strokeWidth={1.5} />
                                </div>
                                <div className="flex-1 pb-2">
                                    <div className="flex items-center space-x-3">
                                        <CardTitle className="text-3xl font-extrabold tracking-tight">{identity?.name || selectedAgent.name || selectedAgent.id}</CardTitle>
                                        <Badge variant="secondary" className="font-mono text-[10px] bg-muted/80">{selectedAgent.id}</Badge>
                                    </div>
                                    <CardDescription className="text-sm font-medium text-muted-foreground/80 mt-1">
                                        Agent Identity & Capability Orchestration
                                    </CardDescription>
                                </div>
                                <div className="flex space-x-2 pb-2">
                                    <Button variant="outline" size="sm" className="bg-background/50 backdrop-blur-sm">
                                        <Eye className="mr-2 h-4 w-4" />
                                        Preview
                                    </Button>
                                    <Button size="sm" className="shadow-md">
                                        <Settings className="mr-2 h-4 w-4" />
                                        Configure
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent className="px-8">
                                <Tabs defaultValue="overview" className="w-full">
                                    <TabsList className="grid w-full grid-cols-4 bg-muted/30 p-1 h-11">
                                        <TabsTrigger value="overview" className="data-[state=active]:bg-background data-[state=active]:shadow-sm">Overview</TabsTrigger>
                                        <TabsTrigger value="workspace" className="data-[state=active]:bg-background data-[state=active]:shadow-sm">Workspace</TabsTrigger>
                                        <TabsTrigger value="tools" className="data-[state=active]:bg-background data-[state=active]:shadow-sm">Skills</TabsTrigger>
                                        <TabsTrigger value="infra" className="data-[state=active]:bg-background data-[state=active]:shadow-sm">Infra</TabsTrigger>
                                    </TabsList>

                                    <TabsContent value="overview" className="space-y-6 pt-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                        <div className="grid gap-6 md:grid-cols-3">
                                            {/* Persona Data */}
                                            <div className="md:col-span-1 space-y-4">
                                                <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center">
                                                    <User className="mr-2 h-3.5 w-3.5 text-primary" />
                                                    Persona Registry
                                                </h4>
                                                <div className="rounded-xl border border-border/50 bg-muted/10 p-4 space-y-4 shadow-sm">
                                                    <div className="flex flex-col space-y-1">
                                                        <span className="text-[10px] font-semibold text-muted-foreground/60">System ID</span>
                                                        <span className="font-mono text-xs font-medium tabular-nums">{selectedAgent.id}</span>
                                                    </div>
                                                    <div className="flex flex-col space-y-1">
                                                        <span className="text-[10px] font-semibold text-muted-foreground/60">Identity Name</span>
                                                        <span className="text-xs font-bold">{identity?.name || 'DeX Core AI'}</span>
                                                    </div>
                                                    <div className="flex flex-col space-y-1">
                                                        <span className="text-[10px] font-semibold text-muted-foreground/60">Object Class</span>
                                                        <Badge variant="outline" className="w-fit text-[9px] h-4 bg-background uppercase font-bold text-primary border-primary/20">Sovereign Agent</Badge>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Active Intelligence */}
                                            <div className="md:col-span-1 space-y-4">
                                                <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center">
                                                    <Zap className="mr-2 h-3.5 w-3.5 text-amber-500" />
                                                    Active Intel
                                                </h4>
                                                <div className="rounded-xl border border-border/50 bg-muted/10 p-4 space-y-4 shadow-sm">
                                                    <div className="flex flex-col space-y-1">
                                                        <span className="text-[10px] font-semibold text-muted-foreground/60">Neural Engine</span>
                                                        <div className="flex items-center space-x-2">
                                                            <div className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
                                                            <span className="font-mono text-xs font-bold">gemini-1.5-pro</span>
                                                        </div>
                                                    </div>
                                                    <div className="flex flex-col space-y-1">
                                                        <span className="text-[10px] font-semibold text-muted-foreground/60">Subscription Tier</span>
                                                        <span className="text-xs font-bold capitalize">{user?.plan || 'Starter'}</span>
                                                    </div>
                                                    <div className="flex flex-col space-y-1">
                                                        <span className="text-[10px] font-semibold text-muted-foreground/60">Latency Profile</span>
                                                        <span className="text-xs font-bold text-green-500 uppercase italic">Ultra-Low</span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* ROI Metrics (Enhancement) */}
                                            <div className="md:col-span-1 space-y-4">
                                                <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center">
                                                    <TrendingUp className="mr-2 h-3.5 w-3.5 text-blue-500" />
                                                    Efficiency metrics
                                                </h4>
                                                <div className="rounded-xl border border-border/50 bg-blue-500/5 p-4 space-y-4 shadow-sm">
                                                    <div className="flex flex-col space-y-1">
                                                        <span className="text-[10px] font-semibold text-muted-foreground/60">Total Yield (30d)</span>
                                                        <div className="flex items-center space-x-1 text-blue-600 dark:text-blue-400">
                                                            <MessageSquare size={12} />
                                                            <span className="text-xs font-bold tabular-nums">
                                                                {usageTotals?.messages || 0} msgs
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <div className="flex flex-col space-y-1">
                                                        <span className="text-[10px] font-semibold text-muted-foreground/60">Resource Efficiency</span>
                                                        <div className="flex items-center space-x-1 text-green-600 dark:text-green-400">
                                                            <TrendingUp size={12} />
                                                            <span className="text-xs font-bold tabular-nums">94.2%</span>
                                                        </div>
                                                    </div>
                                                    <div className="flex flex-col space-y-1">
                                                        <span className="text-[10px] font-semibold text-muted-foreground/60">Est. ROI Contribution</span>
                                                        <div className="flex items-center space-x-1 text-emerald-600 font-bold">
                                                            <DollarSign size={12} />
                                                            <span className="text-xs tabular-nums">$12.40/mo</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Active Connectivity Section */}
                                        <div className="space-y-4 pt-4 border-t border-border/30">
                                            <div className="flex items-center justify-between">
                                                <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center">
                                                    <ExternalLink className="mr-2 h-3.5 w-3.5 text-primary" />
                                                    Omnichannel Matrix
                                                </h4>
                                                <Button variant="ghost" size="sm" className="h-6 text-[9px] uppercase font-bold text-primary">
                                                    Manage Links
                                                    <ChevronRight className="ml-1 h-3 w-3" />
                                                </Button>
                                            </div>

                                            {identity?.linkedChannels && identity.linkedChannels.length > 0 ? (
                                                <div className="grid gap-3 sm:grid-cols-2">
                                                    {identity.linkedChannels.map((chan) => (
                                                        <div key={chan.id} className="group flex items-center justify-between rounded-xl border border-border/50 bg-card p-3 shadow-sm hover:border-primary/30 transition-all">
                                                            <div className="flex items-center space-x-3 overflow-hidden">
                                                                <div className={cn(
                                                                    "flex h-9 w-9 items-center justify-center rounded-lg border shadow-inner flex-shrink-0 transition-transform group-hover:scale-105",
                                                                    chan.status === 'connected'
                                                                        ? "bg-green-500/10 border-green-500/20 text-green-500"
                                                                        : "bg-muted border-border text-muted-foreground/40"
                                                                )}>
                                                                    {chan.type === 'whatsapp' ? <Bot size={18} /> : <Terminal size={18} />}
                                                                </div>
                                                                <div className="flex flex-col overflow-hidden">
                                                                    <span className="text-xs font-bold tracking-tight truncate">{chan.name}</span>
                                                                    <span className="text-[9px] text-muted-foreground/70 font-mono truncate">{chan.account || 'Universal Link'}</span>
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center space-x-2">
                                                                <Badge
                                                                    variant={chan.status === 'connected' ? 'default' : 'outline'}
                                                                    className={cn(
                                                                        "text-[8px] h-4 px-1.5 flex-shrink-0 font-bold tracking-wider",
                                                                        chan.status === 'connected' && "bg-green-500 border-none hover:bg-green-600"
                                                                    )}
                                                                >
                                                                    {chan.status.toUpperCase()}
                                                                </Badge>
                                                                <div className="flex opacity-0 group-hover:opacity-100 transition-opacity">
                                                                    {chan.status === 'connected' ? (
                                                                        <Button
                                                                            variant="ghost"
                                                                            size="icon"
                                                                            className="h-6 w-6 text-destructive hover:bg-destructive/10"
                                                                            onClick={() => handleAction('Unlink', chan.id)}
                                                                        >
                                                                            <Unlink size={12} />
                                                                        </Button>
                                                                    ) : (
                                                                        <Button
                                                                            variant="ghost"
                                                                            size="icon"
                                                                            className="h-6 w-6 text-primary hover:bg-primary/10"
                                                                            onClick={() => handleAction('Reconnect', chan.id)}
                                                                        >
                                                                            <RefreshCw size={12} />
                                                                        </Button>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="flex flex-col items-center justify-center py-10 rounded-2xl border border-dashed border-border/60 bg-muted/5">
                                                    <div className="h-10 w-10 rounded-full bg-muted/20 flex items-center justify-center mb-3">
                                                        <Shield className="h-5 w-5 text-muted-foreground/30" />
                                                    </div>
                                                    <div className="text-xs font-bold text-muted-foreground/80 tracking-tight">SILENT MODE</div>
                                                    <p className="text-[10px] text-muted-foreground/60 mt-1">This agent is not currently linked to any active channel.</p>
                                                    <Button variant="link" size="sm" className="mt-2 text-[10px] h-6 text-primary font-bold">Connect via Infra Tab</Button>
                                                </div>
                                            )}
                                        </div>
                                    </TabsContent>

                                    <TabsContent value="workspace" className="pt-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                        <div className="flex h-[250px] flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border/40 p-12 text-center bg-muted/5 overflow-hidden relative">
                                            <div className="absolute top-0 right-0 p-4 opacity-5">
                                                <Files className="h-40 w-40 rotate-12" />
                                            </div>
                                            <Files className="h-12 w-12 text-muted-foreground/30 mb-4" />
                                            <h5 className="font-bold text-sm tracking-tight">Agent Knowledge Matrix (RAG)</h5>
                                            <p className="text-xs text-muted-foreground/80 mt-2 max-w-xs leading-relaxed">
                                                Local source files and semantic knowledge indexes will be managed within this secure boundary.
                                            </p>
                                            <Button variant="link" size="sm" className="mt-4 text-xs font-bold text-primary">Provision Data Store</Button>
                                        </div>
                                    </TabsContent>

                                    <TabsContent value="tools" className="pt-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                        <div className="space-y-6">
                                            <div className="flex items-center justify-between px-1">
                                                <div>
                                                    <h3 className="text-lg font-extrabold tracking-tight">Intelligence Skills</h3>
                                                    <p className="text-[10px] text-muted-foreground font-medium">Toggle autonomous capabilities for this entity.</p>
                                                </div>
                                                <Badge variant="outline" className="font-mono text-[9px] font-bold bg-primary/5 uppercase border-primary/20 text-primary">
                                                    {user?.plan || 'Starter'} Tier
                                                </Badge>
                                            </div>
                                            <SkillToggle
                                                enabledSkills={selectedAgent.skills || []}
                                                onToggle={handleToggleSkill}
                                            />
                                        </div>
                                    </TabsContent>

                                    <TabsContent value="infra" className="pt-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                        <ChannelLinker agentId={selectedAgent.id} />
                                    </TabsContent>
                                </Tabs>
                            </CardContent>
                        </Card>
                    </div>
                ) : (
                    <div className="flex h-[500px] flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border/50 text-center bg-muted/5">
                        <div className="relative mb-6">
                            <div className="absolute -inset-4 rounded-full bg-primary/5 blur-2xl animate-pulse" />
                            <Bot className="h-16 w-16 text-muted-foreground/20 relative" />
                        </div>
                        <h3 className="text-xl font-bold italic tracking-tight">Awaiting Neural Link</h3>
                        <p className="text-sm text-muted-foreground mt-2 max-w-xs mx-auto leading-relaxed">
                            Select an active cognitive construct from the sidebar to begin orchestration and link performance.
                        </p>
                        <Button onClick={() => setIsCreateOpen(true)} className="mt-6 shadow-md hover:shadow-lg transition-shadow px-6 font-bold">
                            <Plus className="mr-2 h-4 w-4" />
                            Construct New Agent
                        </Button>
                    </div>
                )}
            </div>

            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                <DialogContent className="sm:max-w-4xl border-none shadow-2xl p-0 overflow-hidden rounded-2xl">
                    <div className="h-1.5 w-full bg-gradient-to-r from-primary/50 via-primary to-primary/50" />
                    <div className="p-8">
                        <DialogHeader className="mb-6">
                            <DialogTitle className="text-2xl font-black tracking-tight uppercase">Construct New Intelligence</DialogTitle>
                            <DialogDescription className="text-sm font-medium">
                                Choose a neural template to jumpstart your agent's personality and capability matrix.
                            </DialogDescription>
                        </DialogHeader>
                        <TemplateSelector onSelect={handleCreateAgent} />
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
