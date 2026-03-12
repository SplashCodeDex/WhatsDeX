'use client';

import React, { useMemo } from 'react';
import {
    ReactFlow,
    Background,
    Controls,
    Edge,
    Node,
    Handle,
    Position,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useMastermindStore, MastermindEvent } from '@/stores/useMastermindStore';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Bot, Terminal, Zap, Search, ShieldCheck } from 'lucide-react';

interface AgentNodeProps {
    data: {
        agentId: string;
        name: string;
        events: MastermindEvent[];
        status: string;
    };
}

const AgentNode = ({ data }: AgentNodeProps) => {
    const getEventIcon = (type: string) => {
        switch (type) {
            case 'tool:invoke': return <Zap className="h-2.5 w-2.5 text-amber-500" />;
            case 'agent:spawn': return <Bot className="h-2.5 w-2.5 text-blue-500" />;
            case 'reasoning:thought': return <Search className="h-2.5 w-2.5 text-purple-500" />;
            default: return <Terminal className="h-2.5 w-2.5 text-muted-foreground" />;
        }
    };

    return (
        <Card className="min-w-[220px] border-primary/20 bg-card shadow-xl overflow-hidden">
            <Handle type="target" position={Position.Top} className="w-2 h-2 bg-primary" />
            <div className="bg-primary/5 px-3 py-2 border-b border-border/10 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Bot size={14} className="text-primary" />
                    <span className="text-[10px] font-bold truncate max-w-[120px]">{data.name}</span>
                </div>
                <Badge variant="outline" className="text-[8px] h-4 font-mono px-1">{data.agentId.substring(0, 8)}</Badge>
            </div>
            <CardContent className="p-3 space-y-2">
                <div className="text-[10px] font-semibold text-muted-foreground italic truncate">
                    {data.status}
                </div>
                
                <div className="space-y-1 mt-2">
                    {data.events.slice(-3).map((event, idx) => (
                        <div key={idx} className="flex items-start gap-2 text-[9px] leading-tight animate-in slide-in-from-left-1">
                            <span className="mt-0.5">{getEventIcon(event.type)}</span>
                            <span className="text-muted-foreground/80 truncate">
                                {event.type === 'tool:invoke' ? `Using ${event.toolName}` : event.content || event.type}
                            </span>
                        </div>
                    ))}
                </div>
            </CardContent>
            <Handle type="source" position={Position.Bottom} className="w-2 h-2 bg-primary" />
        </Card>
    );
};

const nodeTypes = {
    agent: AgentNode,
};

export function RecursiveTraceView({ rootAgentId }: { rootAgentId: string }) {
    const traces = useMastermindStore((state) => state.traces);
    const hierarchy = useMastermindStore((state) => state.agentHierarchy);
    const agentStatuses = useMastermindStore((state) => state.agentStatuses);

    const { nodes, edges } = useMemo(() => {
        const initialNodes: Node[] = [];
        const initialEdges: Edge[] = [];
        
        const processedAgents = new Set<string>();

        const buildGraph = (agentId: string, x: number, y: number, level: number) => {
            if (processedAgents.has(agentId)) return;
            processedAgents.add(agentId);

            // 1. Create Node
            initialNodes.push({
                id: agentId,
                type: 'agent',
                data: {
                    agentId,
                    name: agentId === 'system_default' ? 'System Mastermind' : agentId,
                    events: traces[agentId] || [],
                    status: agentStatuses[agentId]?.status || 'Idle'
                },
                position: { x, y },
            });

            // 2. Create Edges and recurse for children
            const children = hierarchy[agentId] || [];
            children.forEach((childId, idx) => {
                initialEdges.push({
                    id: `edge-${agentId}-${childId}`,
                    source: agentId,
                    target: childId,
                    animated: true,
                    style: { stroke: 'hsl(var(--primary))' }
                });
                
                // Simple layouting
                const horizontalSpacing = 300;
                const verticalSpacing = 200;
                const childX = x + (idx - (children.length - 1) / 2) * horizontalSpacing;
                buildGraph(childId, childX, y + verticalSpacing, level + 1);
            });
        };

        buildGraph(rootAgentId, 0, 0, 0);

        return { nodes: initialNodes, edges: initialEdges };
    }, [rootAgentId, traces, hierarchy, agentStatuses]);

    return (
        <div className="h-[500px] w-full border rounded-2xl bg-muted/5 relative overflow-hidden">
            <ReactFlow
                nodes={nodes}
                edges={edges}
                nodeTypes={nodeTypes}
                fitView
                className="bg-dot-pattern"
            >
                <Background />
                <Controls />
            </ReactFlow>
            <div className="absolute top-4 right-4 z-10">
                <Badge className="bg-primary/80 backdrop-blur-sm border-none shadow-lg">LIVE TRACE: {rootAgentId}</Badge>
            </div>
        </div>
    );
}
