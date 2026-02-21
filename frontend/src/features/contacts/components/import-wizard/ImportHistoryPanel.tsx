'use client';

import React from 'react';
import { History, RotateCcw, FileText, CheckCircle2, AlertCircle, Clock, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useImportHistory, useUndoImport } from '@/features/contacts/hooks/useContacts';
import { formatDistanceToNow } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
    SheetDescription
} from '@/components/ui/sheet';
import { toast } from 'sonner';

export function ImportHistoryPanel(): React.ReactNode {
    const { data: history, isLoading } = useImportHistory();
    const undoMutation = useUndoImport();

    const handleUndo = async (importId: string) => {
        try {
            await undoMutation.mutateAsync(importId);
            toast.success('Import rolled back successfully');
        } catch (error: any) {
            toast.error(error.message || 'Failed to undo import');
        }
    };

    return (
        <Sheet>
            <SheetTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2 border-border/40 hover:bg-white/5">
                    <History className="w-4 h-4" />
                    <span className="hidden sm:inline">Import History</span>
                </Button>
            </SheetTrigger>
            <SheetContent className="w-full sm:max-w-md bg-[#1a1a1a]/95 backdrop-blur-xl border-l border-white/5 p-0">
                <SheetHeader className="p-6 pb-2">
                    <SheetTitle className="text-xl font-black tracking-tight text-white flex items-center gap-2">
                        <History className="w-5 h-5 text-primary" /> Import Logs
                    </SheetTitle>
                    <SheetDescription className="text-zinc-400 text-xs mt-1 font-medium">
                        View and manage your contact import history and roll back accidental imports.
                    </SheetDescription>
                </SheetHeader>

                <div className="px-6 py-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500" />
                        <input
                            placeholder="Filter imports..."
                            className="w-full bg-white/5 border border-white/10 rounded-lg py-2 pl-9 pr-4 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-primary/50 transition-all font-medium"
                        />
                    </div>
                </div>

                <ScrollArea className="flex-1 h-[calc(100vh-200px)] px-2">
                    <div className="space-y-2 p-4">
                        {isLoading ? (
                            <div className="flex flex-col items-center justify-center py-20 gap-3 opacity-30">
                                <Clock className="w-8 h-8 animate-spin" />
                                <span className="text-[10px] font-bold uppercase tracking-widest">Loading Logs...</span>
                            </div>
                        ) : !history || history.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-20 text-center space-y-3">
                                <FileText className="w-10 h-10 text-zinc-700" />
                                <div>
                                    <p className="text-sm font-bold text-zinc-400">No imports found</p>
                                    <p className="text-[10px] text-zinc-500 font-medium">Your contact import history will appear here.</p>
                                </div>
                            </div>
                        ) : (
                            history.map((log: any) => (
                                <div
                                    key={log.id}
                                    className={`
                                        group relative p-4 rounded-xl border transition-all duration-300
                                        ${log.status === 'rolled_back'
                                            ? 'bg-red-500/5 border-red-500/20 opacity-60'
                                            : 'bg-white/5 border-white/10 hover:border-primary/30 hover:bg-white/10'
                                        }
                                    `}
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2">
                                                <p className="text-[11px] font-black tracking-tight text-white uppercase truncate max-w-[180px]">
                                                    {log.fileName}
                                                </p>
                                                {log.status === 'rolled_back' && (
                                                    <Badge variant="destructive" className="h-3.5 px-1 text-[8px] font-black uppercase">
                                                        UNDONE
                                                    </Badge>
                                                )}
                                            </div>
                                            <p className="text-[10px] text-zinc-500 font-bold">
                                                {log.timestamp?.seconds
                                                    ? formatDistanceToNow(new Date(log.timestamp.seconds * 1000), { addSuffix: true })
                                                    : 'Just now'
                                                }
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-lg font-black text-white leading-none">
                                                {log.importedCount}
                                            </p>
                                            <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">
                                                Contacts
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between mt-4">
                                        <div className="flex gap-2">
                                            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[9px] font-black">
                                                <CheckCircle2 className="w-2.5 h-2.5" />
                                                SUCCESS
                                            </div>
                                            {log.errors?.length > 0 && (
                                                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[9px] font-black">
                                                    <AlertCircle className="w-2.5 h-2.5" />
                                                    {log.errors.length} ERRORS
                                                </div>
                                            )}
                                        </div>

                                        {log.status !== 'rolled_back' && (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleUndo(log.id)}
                                                disabled={undoMutation.isPending}
                                                className="h-7 px-2 text-[9px] font-black uppercase tracking-tighter hover:bg-red-500/20 hover:text-red-400 transition-colors"
                                            >
                                                <RotateCcw className={`w-3 h-3 mr-1 ${undoMutation.isPending && undoMutation.variables === log.id ? 'animate-spin' : ''}`} />
                                                Undo Import
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </ScrollArea>
            </SheetContent>
        </Sheet>
    );
}
