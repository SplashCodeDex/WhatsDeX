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
} from '@xyflow/react';

import '@xyflow/react/dist/style.css';
import { TriggerNode, ActionNode, LogicNode, AINode } from '@/features/flows/components/CustomNodes';
import { MessageSquare, Zap, GitBranch, Sparkles, Save, Play, Loader2 } from 'lucide-react';
import { api } from '@/lib/api/client';
import { toast } from 'sonner';

const initialNodes: Node[] = [
  { 
    id: '1', 
    position: { x: 250, y: 50 }, 
    data: { keyword: 'hello' }, 
    type: 'trigger' 
  },
  { 
    id: '2', 
    position: { x: 250, y: 250 }, 
    data: { message: 'Hello! How can I help you today?' }, 
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
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [isSaving, setIsSaving] = useState(false);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges],
  );

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
        data: { label: `${type} node` },
      };

      setNodes((nds) => nds.concat(newNode));
    },
    [setNodes],
  );

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

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
          <button className="w-full py-2.5 bg-muted text-muted-foreground rounded-lg font-bold text-[10px] uppercase tracking-widest border border-border/40 hover:bg-muted/80 transition-all flex items-center justify-center gap-2">
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
          nodeTypes={nodeTypes}
          fitView
          colorMode="dark"
        >
          <Controls />
          <MiniMap zoomable pannable />
          <Background variant="dots" gap={12} size={1} />
        </ReactFlow>
      </div>
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
