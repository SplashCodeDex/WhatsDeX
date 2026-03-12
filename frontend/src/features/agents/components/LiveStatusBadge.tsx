'use client';

import React from 'react';
import { useMastermindStore } from '@/stores/useMastermindStore';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Loader2, Zap, Search, ShieldCheck, CheckCircle2, AlertCircle } from 'lucide-react';

interface LiveStatusBadgeProps {
    agentId: string;
    className?: string;
    showText?: boolean;
}

export function LiveStatusBadge({ agentId, className, showText = true }: LiveStatusBadgeProps) {
    const status = useMastermindStore((state) => state.agentStatuses[agentId]);
    
    if (!status || status.status === 'Idle') {
        return null;
    }

    const isError = status.status === 'Error';
    
    const getIcon = () => {
        if (isError) return <AlertCircle className="h-3 w-3 text-destructive" />;
        
        switch (status.stage) {
            case 'planning': return <Zap className="h-3 w-3 text-amber-500 animate-pulse" />;
            case 'researching': return <Search className="h-3 w-3 text-blue-500 animate-spin-slow" />;
            case 'auditing': return <ShieldCheck className="h-3 w-3 text-purple-500 animate-bounce" />;
            case 'synthesizing': return <Loader2 className="h-3 w-3 text-primary animate-spin" />;
            default: return <Loader2 className="h-3 w-3 animate-spin" />;
        }
    };

    return (
        <Badge 
            variant="outline" 
            className={cn(
                "flex items-center gap-1.5 px-2 py-0.5 h-5 text-[10px] font-bold border-primary/20 bg-primary/5 transition-all animate-in fade-in zoom-in-95",
                isError && "border-destructive/20 bg-destructive/5 text-destructive",
                className
            )}
        >
            {getIcon()}
            {showText && <span className="truncate max-w-[100px]">{status.status}</span>}
        </Badge>
    );
}
