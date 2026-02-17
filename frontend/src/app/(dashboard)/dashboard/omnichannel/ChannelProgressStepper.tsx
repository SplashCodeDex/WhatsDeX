'use client';

import { CheckCircle2, Circle, Loader2, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Step {
    id: string;
    label: string;
}

const STEPS: Step[] = [
    { id: 'initializing', label: 'Initializing' },
    { id: 'authenticating', label: 'Authenticating' },
    { id: 'connecting', label: 'Connecting' },
    { id: 'ready', label: 'Finalizing' }
];

interface ChannelProgressStepperProps {
    currentStep: string;
    status: 'pending' | 'in_progress' | 'complete' | 'error';
    className?: string;
}

export function ChannelProgressStepper({ currentStep, status, className }: ChannelProgressStepperProps) {
    // Map backend step names to our display steps if necessary
    // For now, we assume backend sends friendly step names or we handle mapping

    return (
        <div className={cn("space-y-3", className)}>
            <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Connection Progress
                </span>
                <span className={cn(
                    "text-[10px] px-1.5 py-0.5 rounded-full font-mono font-bold",
                    status === 'error' ? "bg-destructive/10 text-destructive" : "bg-primary/10 text-primary"
                )}>
                    {currentStep || 'Starting...'}
                </span>
            </div>

            <div className="flex items-center space-x-1">
                {[1, 2, 3, 4].map((i) => (
                    <div
                        key={i}
                        className={cn(
                            "h-1.5 flex-1 rounded-full bg-muted transition-all duration-500",
                            status === 'complete' && "bg-green-500",
                            status === 'error' && "bg-destructive",
                            status === 'in_progress' && i <= 2 && "bg-primary/60", // Rough estimation for visualization
                            status === 'in_progress' && i === 3 && "bg-primary animate-pulse"
                        )}
                    />
                ))}
            </div>

            <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                {status === 'in_progress' || status === 'pending' ? (
                    <Loader2 className="h-3 w-3 animate-spin text-primary" />
                ) : status === 'complete' ? (
                    <CheckCircle2 className="h-3 w-3 text-green-500" />
                ) : (
                    <XCircle className="h-3 w-3 text-destructive" />
                )}
                <span className="truncate">
                    {status === 'error' ? 'Connection failed' :
                        status === 'complete' ? 'Connection successful' :
                            `Step: ${currentStep}`}
                </span>
            </div>
        </div>
    );
}
