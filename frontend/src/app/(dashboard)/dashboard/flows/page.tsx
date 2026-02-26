'use client';

import React, { useState, useCallback, useMemo } from 'react';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Edge,
  Node,
  ReactFlowProvider,
  BackgroundVariant,
} from '@xyflow/react';

import '@xyflow/react/dist/style.css';
import { TriggerNode, ActionNode, LogicNode, AINode } from '@/features/flows/components/CustomNodes';
import { MessageSquare, Zap, GitBranch, Sparkles, Save, Play, Loader2, Send, Lock } from 'lucide-react';
import { api } from '@/lib/api/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useTemplates } from '@/features/messages/hooks/useTemplates';
import { useSubscription } from '@/features/billing';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';

const initialNodes: Node[] = [
  {
    id: '1',
    position: { x: 250, y: 50 },
    data: { keyword: 'hello', executing: false },
    type: 'trigger'
  },
  {
    id: '2',
    position: { x: 250, y: 250 },
    data: { message: 'Hello! How can I help you today?', executing: false },
    type: 'action'
  },
];

const initialEdges: Edge[] = [{ id: 'e1-2', source: '1', target: '2' }];

const nodeTypes = {
  trigger: TriggerNode,
  action: ActionNode,
  logic: LogicNode,
  ai: AINode,
};

function FlowBuilder() {
  const { data: templates } = useTemplates();
  const { subscription, isLoading: isLoadingPlan } = useSubscription();

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testInput, setTestInput] = useState('');
  const [testLogs, setTestLogs] = useState<string[]>([]);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  const isProFeatureOpen = subscription?.plan !== 'starter';

  // Load existing flows on mount
  React.useEffect(() => {
    if (!isProFeatureOpen) return;
    const loadFlows = async () => {
      try {
        const response = await api.get('/api/flows') as { success: boolean; data?: any[]; error?: any };
        if (response.success && Array.isArray(response.data) && response.data.length > 0) {
          // Load the first active flow for now (can be expanded to a flow selector)
          const flow = response.data[0];
          if (flow.nodes && flow.nodes.length > 0) {
            setNodes(flow.nodes);
            setEdges(flow.edges || []);
          } else {
            // Empty canvas if flow has no nodes
            setNodes([]);
            setEdges([]);
          }
        } else {
          // If no flows exist, start with an empty canvas instead of the starter template
          setNodes([]);
          setEdges([]);
        }
      } catch (error) {
        toast.error('Failed to load flows');
        // Fallback to empty canvas
        setNodes([]);
        setEdges([]);
      }
    };
    loadFlows();
  }, [setNodes, setEdges]);

  const selectedNode = useMemo(() => nodes.find(n => n.id === selectedNodeId), [nodes, selectedNodeId]);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges],
  );

  const onNodeClick = useCallback((_: any, node: Node) => {
    setSelectedNodeId(node.id);
  }, []);

  const onPaneClick = useCallback(() => {
    setSelectedNodeId(null);
  }, []);

  const updateNodeData = useCallback((nodeId: string, newData: any) => {
    setNodes((nds) => nds.map((node) => {
      if (node.id === nodeId) {
        return { ...node, data: { ...node.data, ...newData } };
      }
      return node;
    }));
  }, [setNodes]);

  const onSave = useCallback(async () => {
    setIsSaving(true);
    try {
      const response = await api.post('/api/flows', {
        name: 'New Flow ' + new Date().toLocaleDateString(),
        nodes,
        edges,
        isActive: true
      });

      if (response.success) {
        toast.success('Flow saved successfully');
      } else {
        toast.error(response.error?.message || 'Failed to save flow');
      }
    } catch (error) {
      toast.error('Network error while saving flow');
    } finally {
      setIsSaving(false);
    }
  }, [nodes, edges]);

  const runTest = async () => {
    if (!testInput.trim()) return;

    setTestLogs([`User: ${testInput}`]);

    // Find trigger node
    const trigger = nodes.find(n => n.type === 'trigger' && (n.data as any).keyword?.toLowerCase() === testInput.toLowerCase());

    if (!trigger) {
      setTestLogs(prev => [...prev, "System: No matching trigger found."]);
      return;
    }

    // Reset all nodes
    setNodes(nds => nds.map(n => ({ ...n, data: { ...n.data, executing: false } })));

    // Execute path
    let currentNodeId = trigger.id;
    await executeSimulationStep(currentNodeId);
  };

  const executeSimulationStep = async (nodeId: string) => {
    const node = nodes.find(n => n.id === nodeId);
    if (!node) return;

    // Highlight node
    setNodes(nds => nds.map(n => n.id === nodeId ? { ...n, data: { ...n.data, executing: true } } : n));

    // Log action
    if (node.type === 'action') {
      setTestLogs(prev => [...prev, `Bot: ${(node.data as any).message || '(Empty Message)'}`]);
    } else if (node.type === 'trigger') {
      setTestLogs(prev => [...prev, `System: Trigger matched [${(node.data as any).keyword}]`]);
    }

    // Wait for effect
    await new Promise(r => setTimeout(r, 1000));

    // Find next nodes
    const outboundEdges = edges.filter(e => e.source === nodeId);
    for (const edge of outboundEdges) {
      // Un-highlight current
      setNodes(nds => nds.map(n => n.id === nodeId ? { ...n, data: { ...n.data, executing: false } } : n));
      await executeSimulationStep(edge.target);
    }

    // Final un-highlight
    setNodes(nds => nds.map(n => n.id === nodeId ? { ...n, data: { ...n.data, executing: false } } : n));
  };

  const onDragStart = (event: React.DragEvent, nodeType: string) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.effectAllowed = 'move';
  };

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const type = event.dataTransfer.getData('application/reactflow');

      if (typeof type === 'undefined' || !type) {
        return;
      }

      const position = { x: event.clientX - 400, y: event.clientY - 200 }; // Offset for sidebar and header
      const newNode = {
        id: `node_${Date.now()}`,
        type,
        position,
        data: { label: `${type} node`, executing: false },
      };

      setNodes((nds) => nds.concat(newNode));
    },
    [setNodes],
  );

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  if (isLoadingPlan) {
    return (
      <div className="flex h-[calc(100vh-120px)] w-full items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!isProFeatureOpen) {
    return (
      <div className="flex flex-col h-[calc(100vh-120px)] w-full items-center justify-center bg-card/10 backdrop-blur-sm border border-border/40 rounded-xl p-8 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-background/80 pointer-events-none" />
        <div className="relative z-10 flex flex-col items-center max-w-md mx-auto space-y-6">
          <div className="h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center ring-4 ring-primary/5">
            <Lock className="w-8 h-8 text-primary" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-black tracking-tight">Pro Feature</h2>
            <p className="text-muted-foreground">
              The Agentic Flow Builder is a premium feature. Upgrade your workspace to build automated conversation flows and AI-driven logic.
            </p>
          </div>
          <Button size="lg" className="w-full font-bold shadow-lg shadow-primary/25" onClick={() => window.location.href = '/dashboard/settings?tab=billing'}>
            <Sparkles className="w-4 h-4 mr-2" />
            Upgrade to Pro
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-120px)] w-full gap-4 overflow-hidden">
      {/* Sidebar */}
      <div className="w-64 border border-border/40 rounded-xl bg-card/30 backdrop-blur-md p-4 flex flex-col gap-4">
        <div>
          <h2 className="text-xs font-black uppercase tracking-tighter text-muted-foreground mb-4">Node Palette</h2>
          <div className="space-y-2">
            <div
              className="p-3 rounded-lg border border-border/40 bg-background/50 cursor-grab hover:border-green-500/50 transition-colors flex items-center gap-3 group"
              onDragStart={(e) => onDragStart(e, 'trigger')}
              draggable
            >
              <div className="p-1.5 rounded-md bg-green-500/10 text-green-500">
                <Zap className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold uppercase tracking-tight group-hover:text-green-500 transition-colors">Trigger</span>
            </div>

            <div
              className="p-3 rounded-lg border border-border/40 bg-background/50 cursor-grab hover:border-blue-500/50 transition-colors flex items-center gap-3 group"
              onDragStart={(e) => onDragStart(e, 'action')}
              draggable
            >
              <div className="p-1.5 rounded-md bg-blue-500/10 text-blue-500">
                <MessageSquare className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold uppercase tracking-tight group-hover:text-blue-500 transition-colors">Action</span>
            </div>

            <div
              className="p-3 rounded-lg border border-border/40 bg-background/50 cursor-grab hover:border-amber-500/50 transition-colors flex items-center gap-3 group"
              onDragStart={(e) => onDragStart(e, 'logic')}
              draggable
            >
              <div className="p-1.5 rounded-md bg-amber-500/10 text-amber-500">
                <GitBranch className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold uppercase tracking-tight group-hover:text-amber-500 transition-colors">Logic</span>
            </div>

            <div
              className="p-3 rounded-lg border border-border/40 bg-background/50 cursor-grab hover:border-purple-500/50 transition-colors flex items-center gap-3 group"
              onDragStart={(e) => onDragStart(e, 'ai')}
              draggable
            >
              <div className="p-1.5 rounded-md bg-purple-500/10 text-purple-500">
                <Sparkles className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold uppercase tracking-tight group-hover:text-purple-500 transition-colors">Gemini AI</span>
            </div>
          </div>
        </div>

        <div className="mt-auto space-y-2">
          <button
            className="w-full py-2.5 bg-primary text-primary-foreground rounded-lg font-bold text-[10px] uppercase tracking-widest shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            onClick={onSave}
            disabled={isSaving}
          >
            {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            Save Flow
          </button>
          <button
            className="w-full py-2.5 bg-muted text-muted-foreground rounded-lg font-bold text-[10px] uppercase tracking-widest border border-border/40 hover:bg-muted/80 transition-all flex items-center justify-center gap-2"
            onClick={() => setIsTesting(true)}
          >
            <Play className="w-3.5 h-3.5" /> Test Flow
          </button>
        </div>
      </div>

      {/* Canvas */}
      <div className="flex-1 border border-border/40 rounded-xl overflow-hidden bg-background/50 backdrop-blur-xl relative" onDrop={onDrop} onDragOver={onDragOver}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeClick={onNodeClick}
          onPaneClick={onPaneClick}
          nodeTypes={nodeTypes}
          fitView
          colorMode="dark"
        >
          <Controls />
          <MiniMap zoomable pannable />
          <Background variant={BackgroundVariant.Dots} gap={12} size={1} />
        </ReactFlow>
      </div>

      {/* Properties Panel */}
      {selectedNode && (
        <div className="w-80 border border-border/40 rounded-xl bg-card/30 backdrop-blur-md p-4 flex flex-col gap-6 animate-in slide-in-from-right duration-300">
          <div>
            <h2 className="text-xs font-black uppercase tracking-tighter text-primary mb-4">Node Properties</h2>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase text-muted-foreground">Node ID</label>
                <div className="text-xs font-mono p-2 bg-muted/30 rounded border border-border/20">{selectedNode.id}</div>
              </div>

              {selectedNode.type === 'trigger' && (
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase text-muted-foreground">Keyword Match</label>
                  <Input
                    value={(selectedNode.data as any).keyword || ''}
                    onChange={(e) => updateNodeData(selectedNode.id, { keyword: e.target.value })}
                    placeholder="e.g. hello"
                  />
                </div>
              )}

              {selectedNode.type === 'action' && (
                <>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase text-muted-foreground">Select Template</label>
                    <Select
                      value={(selectedNode.data as any).templateId || 'none'}
                      onValueChange={(val) => {
                        const tpl = templates?.find(t => t.id === val);
                        updateNodeData(selectedNode.id, {
                          templateId: val === 'none' ? null : val,
                          templateName: tpl?.name || null
                        });
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a template" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No Template (Use Raw Message)</SelectItem>
                        {templates?.map(t => (
                          <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {!(selectedNode.data as any).templateId && (
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase text-muted-foreground">Raw Message</label>
                      <textarea
                        className="w-full h-24 p-3 rounded-lg bg-muted/30 border border-border/20 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                        value={(selectedNode.data as any).message || ''}
                        onChange={(e) => updateNodeData(selectedNode.id, { message: e.target.value })}
                        placeholder="Type your message..."
                      />
                    </div>
                  )}
                </>
              )}

              {selectedNode.type === 'logic' && (
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase text-muted-foreground">Condition</label>
                  <Select
                    value={(selectedNode.data as any).condition || 'is_premium'}
                    onValueChange={(val) => updateNodeData(selectedNode.id, { condition: val })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="is_premium">User is Premium</SelectItem>
                      <SelectItem value="has_tag">User has Tag</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Test Flow Modal */}
      <Dialog open={isTesting} onOpenChange={setIsTesting}>
        <DialogContent className="sm:max-w-[500px] border-border/40 bg-card/90 backdrop-blur-xl">
          <DialogHeader>
            <DialogTitle>Simulator: Test Your Flow</DialogTitle>
            <DialogDescription>
              Type a message to see how your flow handles it in real-time.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-4 py-4">
            <div className="h-[250px] w-full rounded-xl bg-background/50 border border-border/20 p-4 font-mono text-xs overflow-y-auto space-y-2">
              {testLogs.length === 0 && <p className="text-muted-foreground italic">No simulation logs yet...</p>}
              {testLogs.map((log, i) => (
                <p key={i} className={cn(
                  log.startsWith('User:') ? "text-primary" :
                    log.startsWith('Bot:') ? "text-green-500 font-bold" :
                      "text-muted-foreground"
                )}>
                  {log}
                </p>
              ))}
            </div>

            <div className="flex gap-2">
              <Input
                placeholder="Type a message (e.g. 'hello')"
                value={testInput}
                onChange={(e) => setTestInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && runTest()}
              />
              <button
                onClick={runTest}
                className="p-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>

          <DialogFooter>
            <button
              onClick={() => {
                setIsTesting(false);
                setTestLogs([]);
                setTestInput('');
                setNodes(nds => nds.map(n => ({ ...n, data: { ...n.data, executing: false } })));
              }}
              className="text-xs font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground"
            >
              Close Simulator
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function FlowsPage() {
  return (
    <ReactFlowProvider>
      <FlowBuilder />
    </ReactFlowProvider>
  );
}
