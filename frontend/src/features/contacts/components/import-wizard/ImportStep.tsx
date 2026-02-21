'use client';

import React from 'react';
import { CheckCircle2, AlertCircle, Loader2, PartyPopper, RotateCcw } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

interface ImportStepProps {
    readonly isPending: boolean;
    readonly isSuccess: boolean;
    readonly isError: boolean;
    readonly error: Error | null;
    readonly importedCount: number;
    readonly totalCount: number;
    readonly onRetry: () => void;
    readonly onClose: () => void;
}

export function ImportStep({
    isPending,
    isSuccess,
    isError,
    error,
    importedCount,
    totalCount,
    onRetry,
    onClose,
}: ImportStepProps): React.ReactNode {
    const progress = totalCount > 0 ? Math.round((importedCount / totalCount) * 100) : 0;

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            {/* Importing State */}
            {isPending && (
                <div className="flex flex-col items-center justify-center py-8 space-y-6">
                    <div className="relative">
                        <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
                            <Loader2 className="w-10 h-10 text-primary animate-spin" />
                        </div>
                        <div className="absolute -inset-2 rounded-full border-2 border-primary/20 animate-pulse" />
                    </div>
                    <div className="text-center space-y-2 w-full max-w-xs">
                        <p className="font-bold">Importing Contacts...</p>
                        <p className="text-xs text-muted-foreground">
                            Processing {totalCount} contacts. This may take a moment.
                        </p>
                        <Progress value={progress} className="h-2 mt-4" />
                        <p className="text-[10px] text-muted-foreground font-mono font-bold">
                            {importedCount} / {totalCount}
                        </p>
                    </div>
                </div>
            )}

            {/* Success State */}
            {isSuccess && (
                <div className="flex flex-col items-center justify-center py-8 space-y-6 animate-in fade-in zoom-in-95 duration-500">
                    <div className="relative">
                        <div className="w-24 h-24 rounded-full bg-emerald-500/10 flex items-center justify-center">
                            <PartyPopper className="w-12 h-12 text-emerald-400" />
                        </div>
                        {/* Celebration rings */}
                        <div className="absolute -inset-3 rounded-full border-2 border-emerald-500/20 animate-ping" style={{ animationDuration: '2s' }} />
                        <div className="absolute -inset-6 rounded-full border border-emerald-500/10 animate-ping" style={{ animationDuration: '3s' }} />
                    </div>
                    <div className="text-center space-y-2">
                        <p className="text-2xl font-black text-emerald-400">Import Complete</p>
                        <p className="text-sm text-muted-foreground">
                            Successfully imported <span className="font-black text-emerald-400">{importedCount}</span> contacts
                        </p>
                    </div>
                    <Button
                        onClick={onClose}
                        className="mt-4 px-8 h-10 font-bold uppercase tracking-widest text-[11px] bg-emerald-500 text-white hover:bg-emerald-600 shadow-lg shadow-emerald-500/20"
                    >
                        Done
                    </Button>
                </div>
            )}

            {/* Error State */}
            {isError && (
                <div className="flex flex-col items-center justify-center py-8 space-y-6 animate-in fade-in zoom-in-95 duration-500">
                    <div className="w-20 h-20 rounded-full bg-red-500/10 flex items-center justify-center">
                        <AlertCircle className="w-10 h-10 text-red-400" />
                    </div>
                    <div className="text-center space-y-2 max-w-sm">
                        <p className="text-lg font-black text-red-400">Import Failed</p>
                        <Alert variant="destructive" className="bg-red-500/10 border-red-500/20 text-red-400">
                            <AlertCircle className="h-4 w-4" />
                            <AlertTitle className="font-bold text-xs">Error Details</AlertTitle>
                            <AlertDescription className="text-[11px]">
                                {error?.message || 'The server rejected the import request. Please verify your file format and try again.'}
                            </AlertDescription>
                        </Alert>
                    </div>
                    <div className="flex gap-3">
                        <Button
                            variant="outline"
                            onClick={onRetry}
                            className="font-bold uppercase tracking-widest text-[11px] h-10 gap-2"
                        >
                            <RotateCcw className="w-3.5 h-3.5" />
                            Retry
                        </Button>
                        <Button
                            variant="ghost"
                            onClick={onClose}
                            className="font-bold uppercase tracking-widest text-[11px] h-10"
                        >
                            Close
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}
