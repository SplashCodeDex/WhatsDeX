'use client';

import React, { useMemo } from 'react';
import { useOmnichannelStore } from '@/stores/useOmnichannelStore';
import { 
    GitBranch, 
    Search, 
    ShieldCheck, 
    BrainCircuit,
    Clock,
    ChevronRight,
    Loader2,
    AlertCircle,
    CheckCircle2
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface TraceNodeProps {
    node: any;
    depth: number;
    isLast: boolean;
}

const TraceNode = ({ node, depth, isLast }: TraceNodeProps) => {
    const Icon = node.label === 'Researcher' || node.label === 'Lead Researcher' ? Search :
                 node.label === 'Fact-Checker' ? ShieldCheck :
                 node.label === 'Mastermind Synthesis' ? BrainCircuit : GitBranch;

    return (
        <div className="relative">
            {/* Connection Line */}
            {depth > 0 && (
                <div 
                    className="absolute -left-4 top-0 bottom-0 w-px bg-border/50" 
                    style={{ left: `-${(depth * 16) - 8}px` }}
                />
            )}
            
            <div className={cn(
                "flex items-start gap-3 p-3 rounded-lg border border-border/40 bg-background/30 mb-2 transition-all hover:bg-background/50",
                node.status === 'thinking' && "border-primary/30 shadow-[0_0_15px_rgba(var(--primary),0.05)]"
            )}
            style={{ marginLeft: `${depth * 16}px` }}>
                <div className={cn(
                    "p-1.5 rounded-md",
                    node.status === 'thinking' ? "bg-primary/10 text-primary animate-pulse" :
                    node.status === 'complete' ? "bg-green-500/10 text-green-500" :
                    "bg-destructive/10 text-destructive"
                )}>
                    <Icon className="w-4 h-4" />
                </div>
                
                <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-bold uppercase tracking-tight truncate">{node.label}</span>
                        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground whitespace-nowrap">
                            <Clock className="w-3 h-3" />
                            {new Date(node.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </div>
                    </div>
                    
                    {node.task && (
                        <p className="text-[11px] text-muted-foreground line-clamp-1 mt-0.5 italic">
                            &quot;{node.task}&quot;
                        </p>
                    )}

                    <div className="flex items-center gap-2 mt-2">
                        {node.status === 'thinking' ? (
                            <span className="flex items-center gap-1 text-[10px] text-primary font-medium">
                                <Loader2 className="w-3 h-3 animate-spin" />
                                Reasoning...
                            </span>
                        ) : node.status === 'complete' ? (
                            <span className="flex items-center gap-1 text-[10px] text-green-500 font-medium">
                                <CheckCircle2 className="w-3 h-3" />
                                Verified
                            </span>
                        ) : (
                            <span className="flex items-center gap-1 text-[10px] text-destructive font-medium">
                                <AlertCircle className="w-3 h-3" />
                                Error
                            </span>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export const NestedResearchTrace = () => {
    const { nestedTrace, clearTrace } = useOmnichannelStore();

    if (nestedTrace.length === 0) return null;

    return (
        <div className="rounded-xl border border-border/50 bg-card overflow-hidden shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="p-4 border-b border-border/40 bg-muted/20 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <BrainCircuit className="w-4 h-4 text-primary" />
                    <h3 className="text-sm font-bold uppercase tracking-tighter">Live Reasoning Trace</h3>
                </div>
                <button 
                    onClick={clearTrace}
                    className="text-[10px] font-black uppercase text-muted-foreground hover:text-foreground transition-colors"
                >
                    Clear
                </button>
            </div>
            
            <div className="p-4 max-h-[400px] overflow-y-auto custom-scrollbar bg-grid-white/[0.02]">
                {nestedTrace.map((node, index) => {
                    // Simple flat list for now, we'll implement depth logic later if parent IDs are provided
                    const depth = node.parent ? 1 : 0; 
                    return (
                        <TraceNode 
                            key={node.id} 
                            node={node} 
                            depth={depth} 
                            isLast={index === nestedTrace.length - 1} 
                        />
                    );
                })}
            </div>
            
            <div className="p-3 bg-muted/10 border-t border-border/40 text-center">
                <p className="text-[9px] text-muted-foreground uppercase font-medium tracking-widest">
                    Phase 2 Mastermind Engine &bull; Depth 5 Enabled
                </p>
            </div>
        </div>
    );
};
