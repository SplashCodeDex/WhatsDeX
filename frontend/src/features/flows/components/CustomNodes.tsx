'use client';

import React from 'react';
import { BaseNode } from './BaseNode';
import { MessageSquare, Zap, GitBranch, Sparkles } from 'lucide-react';

export function TriggerNode({ data, selected }: any) {
  return (
    <BaseNode title="Trigger" icon={<Zap className="w-4 h-4" />} type="trigger" selected={selected} executing={data.executing}>
      <div className="space-y-2">
        <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-tighter">Incoming Message</p>
        <div className="p-2 rounded-lg bg-background/50 border border-border/20 text-xs font-mono truncate">
          {data.keyword || 'Match ANY'}
        </div>
      </div>
    </BaseNode>
  );
}

export function ActionNode({ data, selected }: any) {
  return (
    <BaseNode title="Action" icon={<MessageSquare className="w-4 h-4" />} type="action" selected={selected} executing={data.executing}>
      <div className="space-y-2">
        <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-tighter">Send Message</p>
        <div className="p-2 rounded-lg bg-background/50 border border-border/20 text-xs line-clamp-2 italic">
          {data.templateName ? `Template: ${data.templateName}` : (data.message || 'No message defined')}
        </div>
      </div>
    </BaseNode>
  );
}

export function LogicNode({ data, selected }: any) {
  return (
    <BaseNode title="Logic" icon={<GitBranch className="w-4 h-4" />} type="logic" selected={selected} executing={data.executing}>
      <div className="space-y-2">
        <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-tighter">Conditional Split</p>
        <div className="p-2 rounded-lg bg-background/50 border border-border/20 text-xs truncate">
          {data.condition || 'Check user status'}
        </div>
      </div>
    </BaseNode>
  );
}

export function AINode({ data, selected }: any) {
  return (
    <BaseNode title="Gemini AI" icon={<Sparkles className="w-4 h-4" />} type="ai" selected={selected} executing={data.executing}>
      <div className="space-y-2">
        <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-tighter">Agent Response</p>
        <div className="p-2 rounded-lg bg-purple-500/5 border border-purple-500/20 text-xs">
          Let AI decide the best response based on context.
        </div>
      </div>
    </BaseNode>
  );
}
