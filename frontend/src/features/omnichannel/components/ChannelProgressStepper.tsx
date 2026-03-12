'use client';

import { CheckCircle2, Loader2, XCircle, QrCode } from 'lucide-react';

import { useChannelStatus } from '@/hooks/useChannelStatus';
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
    channelId: string;
    agentId: string;
    currentStep: string;
    status: 'pending' | 'in_progress' | 'complete' | 'error';
    className?: string;
}

export function ChannelProgressStepper({ channelId, agentId, currentStep, status, className }: ChannelProgressStepperProps) {
    const { qrCode, isLoading: isStatusLoading } = useChannelStatus(channelId, agentId, status === 'in_progress' || status === 'pending');

    return (
        <div className={cn("space-y-4", className)}>
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

            {/* QR Code Surfacing */}
            {qrCode ? <div className="flex flex-col items-center justify-center p-4 bg-white rounded-lg border border-border shadow-inner animate-in fade-in zoom-in duration-300">
                    <img
                        src={qrCode}
                        alt="Channel QR Code"
                        className="w-40 h-40 object-contain"
                    />
                    <div className="mt-3 flex items-center gap-2 text-[10px] text-zinc-500 font-medium">
                        <QrCode className="h-3 w-3" />
                        Scan with your mobile app
                    </div>
                </div> : null}

            <div className="flex items-center space-x-1">
                {[1, 2, 3, 4].map((i) => (
                    <div
                        key={i}
                        className={cn(
                            "h-1.5 flex-1 rounded-full bg-muted transition-all duration-500",
                            status === 'complete' && "bg-green-500",
                            status === 'error' && "bg-destructive",
                            status === 'in_progress' && i <= 2 && "bg-primary/60",
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
                            qrCode ? 'Awaiting Scan...' : `Step: ${currentStep}`}
                </span>
            </div>
        </div>
    );
}
