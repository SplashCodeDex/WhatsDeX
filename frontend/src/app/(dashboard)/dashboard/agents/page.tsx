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
    Plus
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

export default function AgentsPage() {
    const {
        agentsResult,
        agentIdentities,
        fetchAgents,
        fetchAgentIdentity,
        isLoading
    } = useOmnichannelStore();
    const { user } = useAuth();
    const { createAgent, isLoading: isCreating } = useCreateAgent();

    const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [isCreateOpen, setIsCreateOpen] = useState(false);

    const handleRefresh = async () => {
        setIsRefreshing(true);
        await fetchAgents();
        setIsRefreshing(false);
    };

    const handleCreateAgent = async (template: AgentTemplate) => {
        setIsCreateOpen(false);
        const promise = createAgent({
            name: template.title,
            emoji: template.emoji || '🤖',
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
                    <h2 className="text-3xl font-bold tracking-tight text-foreground font-foreground">Agent Orchestration</h2>
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
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Active Agents</CardTitle>
                    </CardHeader>
                    <CardContent className="px-2">
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
                                                "flex w-full items-center space-x-3 rounded-lg px-3 py-2 text-left transition-colors",
                                                isActive ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                                            )}
                                        >
                                            <div className={cn(
                                                "flex h-8 w-8 items-center justify-center rounded-full bg-muted font-bold",
                                                isActive && "bg-primary/20"
                                            )}>
                                                {agentIdentity?.emoji || agent.name?.slice(0, 1) || agent.id.slice(0, 1).toUpperCase()}
                                            </div>
                                            <div className="flex-1 overflow-hidden">
                                                <div className="truncate text-xs font-semibold">{agentIdentity?.name || agent.name || agent.id}</div>
                                                <div className="truncate text-[10px] opacity-60 font-mono">{agent.id}</div>
                                            </div>
                                            {agent.id === agentsResult?.defaultId && (
                                                <Badge variant="outline" className="h-4 px-1 text-[8px] uppercase">Default</Badge>
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
                        <Card className="border-border/50 bg-card overflow-hidden">
                            <div className="h-24 bg-gradient-to-r from-primary/20 via-primary/5 to-transparent" />
                            <CardHeader className="relative -mt-12 flex flex-row items-end space-x-4 pb-6">
                                <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-card border-2 border-primary/20 shadow-xl text-3xl">
                                    {identity?.emoji || '🤖'}
                                </div>
                                <div className="flex-1 pb-1">
                                    <div className="flex items-center space-x-2">
                                        <CardTitle className="text-2xl">{identity?.name || selectedAgent.name || selectedAgent.id}</CardTitle>
                                        <Badge variant="outline" className="font-mono text-[10px]">{selectedAgent.id}</Badge>
                                    </div>
                                    <CardDescription>
                                        Agent Identity & Capability Control
                                    </CardDescription>
                                </div>
                                <div className="flex space-x-2 pb-1">
                                    <Button variant="outline" size="sm">
                                        <Eye className="mr-2 h-4 w-4" />
                                        Preview
                                    </Button>
                                    <Button size="sm">
                                        <Settings className="mr-2 h-4 w-4" />
                                        Edit Agent
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <Tabs defaultValue="overview" className="w-full">
                                    <TabsList className="grid w-full grid-cols-4 bg-muted/50">
                                        <TabsTrigger value="overview">Overview</TabsTrigger>
                                        <TabsTrigger value="workspace">Workspace</TabsTrigger>
                                        <TabsTrigger value="tools">Tools & Skills</TabsTrigger>
                                        <TabsTrigger value="infra">Infrastructure</TabsTrigger>
                                    </TabsList>

                                    <TabsContent value="overview" className="space-y-6 pt-6">
                                        <div className="grid gap-4 md:grid-cols-2">
                                            <div className="space-y-4">
                                                <h4 className="text-sm font-semibold text-muted-foreground flex items-center">
                                                    <User className="mr-2 h-4 w-4" />
                                                    Persona Data
                                                </h4>
                                                <div className="rounded-lg border bg-muted/20 p-4 space-y-3">
                                                    <div className="flex justify-between text-xs">
                                                        <span className="text-muted-foreground">Internal Name</span>
                                                        <span className="font-mono">{selectedAgent.id}</span>
                                                    </div>
                                                    <div className="flex justify-between text-xs">
                                                        <span className="text-muted-foreground">Display Name</span>
                                                        <span>{identity?.name || 'N/A'}</span>
                                                    </div>
                                                    <div className="flex justify-between text-xs">
                                                        <span className="text-muted-foreground">Emoji Avatar</span>
                                                        <span>{identity?.emoji || 'N/A'}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="space-y-4">
                                                <h4 className="text-sm font-semibold text-muted-foreground flex items-center">
                                                    <Zap className="mr-2 h-4 w-4" />
                                                    Active Intelligence
                                                </h4>
                                                <div className="rounded-lg border bg-muted/20 p-4 space-y-3">
                                                    <div className="flex justify-between text-xs">
                                                        <span className="text-muted-foreground">Primary Model</span>
                                                        <Badge variant="secondary" className="font-mono text-[10px]">gemini-1.5-pro</Badge>
                                                    </div>
                                                    <div className="flex justify-between text-xs">
                                                        <span className="text-muted-foreground">Fallback Strategy</span>
                                                        <span className="text-green-500 text-[10px] font-bold uppercase">Dynamic</span>
                                                    </div>
                                                    <div className="flex justify-between text-xs">
                                                        <span className="text-muted-foreground">Skill Tier</span>
                                                        <span className="capitalize">{user?.plan || 'Starter'}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </TabsContent>

                                    <TabsContent value="workspace" className="pt-6">
                                        <div className="flex h-[200px] flex-col items-center justify-center rounded-lg border-2 border-dashed border-border p-12 text-center bg-muted/10">
                                            <Files className="h-8 w-8 text-muted-foreground/30 mb-2" />
                                            <h5 className="font-medium text-sm">Agent Workspace (RAG)</h5>
                                            <p className="text-xs text-muted-foreground mt-1 max-w-xs">
                                                Local files and knowledge base for this agent will be available here.
                                            </p>
                                            <Button variant="link" size="sm" className="mt-2 text-xs">Configure Workspace</Button>
                                        </div>
                                    </TabsContent>

                                    <TabsContent value="tools" className="pt-6">
                                        <div className="space-y-6">
                                            <div className="flex items-center justify-between">
                                                <h3 className="text-lg font-semibold">Available Intelligence Skills</h3>
                                                <Badge variant="outline" className="font-mono text-[10px]">
                                                    {user?.plan || 'Starter'} Tier
                                                </Badge>
                                            </div>
                                            <SkillToggle
                                                enabledSkills={selectedAgent.skills || []}
                                                onToggle={(id, enabled) => {
                                                    toast.info(`${enabled ? 'Enabling' : 'Disabling'} skill: ${id}`);
                                                    // Wiring to backend will happen in next task
                                                }}
                                            />
                                        </div>
                                    </TabsContent>

                                    <TabsContent value="infra" className="pt-6">
                                        <ChannelLinker agentId={selectedAgent.id} />
                                    </TabsContent>
                                </Tabs>
                            </CardContent>
                        </Card>
                    </div>
                ) : (
                    <div className="flex h-[400px] flex-col items-center justify-center rounded-xl border-2 border-dashed text-center">
                        <Bot className="h-12 w-12 text-muted-foreground/20 mb-4" />
                        <h3 className="text-lg font-semibold italic">Select an agent to manage</h3>
                        <p className="text-sm text-muted-foreground mt-2 max-w-xs mx-auto">
                            Pick one of your configured agents from the list to view its workspace, tools, and identity.
                        </p>
                        <Button onClick={() => setIsCreateOpen(true)} className="mt-4">
                            <Plus className="mr-2 h-4 w-4" />
                            Create New Agent
                        </Button>
                    </div>
                )}
            </div>

            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                <DialogContent className="sm:max-w-4xl">
                    <DialogHeader>
                        <DialogTitle>Create New Agent</DialogTitle>
                        <DialogDescription>
                            Choose a template to jumpstart your agent's personality and skills.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        <TemplateSelector onSelect={handleCreateAgent} />
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
