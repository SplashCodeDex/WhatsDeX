'use client';

import React from 'react';
import { Handle, Position } from '@xyflow/react';
import { cn } from '@/lib/utils';

interface BaseNodeProps {
  title: string;
  icon?: React.ReactNode;
  children?: React.ReactNode;
  selected?: boolean;
  type: 'trigger' | 'action' | 'logic' | 'ai';
}

export function BaseNode({ title, icon, children, selected, type }: BaseNodeProps) {
  return (
    <div className={cn(
      "min-w-[200px] rounded-xl border bg-card/80 backdrop-blur-md shadow-xl transition-all duration-300",
      selected ? "ring-2 ring-primary border-primary" : "border-border/40",
      type === 'trigger' && "border-l-4 border-l-green-500",
      type === 'action' && "border-l-4 border-l-blue-500",
      type === 'logic' && "border-l-4 border-l-amber-500",
      type === 'ai' && "border-l-4 border-l-purple-500"
    )}>
      <div className="flex items-center gap-2 p-3 border-b border-border/20 bg-muted/30 rounded-t-xl">
        <div className={cn(
          "p-1.5 rounded-lg",
          type === 'trigger' && "bg-green-500/10 text-green-500",
          type === 'action' && "bg-blue-500/10 text-blue-500",
          type === 'logic' && "bg-amber-500/10 text-amber-500",
          type === 'ai' && "bg-purple-500/10 text-purple-500"
        )}>
          {icon}
        </div>
        <span className="text-xs font-black uppercase tracking-widest truncate">{title}</span>
      </div>
      
      <div className="p-4 text-sm font-medium text-foreground/80">
        {children}
      </div>

      {/* Handles */}
      {type !== 'trigger' && (
        <Handle
          type="target"
          position={Position.Top}
          className="w-3 h-3 border-2 border-background bg-primary"
        />
      )}
      <Handle
        type="source"
        position={Position.Bottom}
        className="w-3 h-3 border-2 border-background bg-primary"
      />
    </div>
  );
}
