'use client';

import React from 'react';
import { CheckCircle2, AlertTriangle, XCircle, Tag, Shield } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import { useCheckDuplicates } from '@/features/contacts/hooks/useContacts';
import type { ValidationResult } from './wizardUtils';
import { getValidationStats } from './wizardUtils';

interface ValidationStepProps {
    readonly validatedRows: readonly ValidationResult[];
    readonly importTag: string;
    readonly onImportTagChange: (tag: string) => void;
    readonly excludeInvalid: boolean;
    readonly onExcludeInvalidChange: (exclude: boolean) => void;
}

const STATUS_CONFIG = {
    valid: { icon: CheckCircle2, color: 'text-emerald-400', bg: 'bg-emerald-500/10', label: 'Valid' },
    warning: { icon: AlertTriangle, color: 'text-amber-400', bg: 'bg-amber-500/10', label: 'Warning' },
    error: { icon: XCircle, color: 'text-red-400', bg: 'bg-red-500/10', label: 'Error' },
} as const;

export function ValidationStep({
    validatedRows,
    importTag,
    onImportTagChange,
    excludeInvalid,
    onExcludeInvalidChange,
}: ValidationStepProps): React.ReactNode {
    const stats = getValidationStats(validatedRows);
    const [duplicates, setDuplicates] = React.useState<Set<string>>(new Set());
    const checkDuplicates = useCheckDuplicates();

    // Perform duplicate detection on mount/row change
    React.useEffect(() => {
        const phones = validatedRows
            .map(r => r.row.phone)
            .filter((p): p is string => !!p && p.length > 0);

        if (phones.length > 0) {
            checkDuplicates.mutate(phones, {
                onSuccess: (data) => setDuplicates(new Set(data)),
            });
        }
    }, [validatedRows]);

    return (
        <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
            {/* Stats Bar */}
            <div className="grid grid-cols-3 gap-3">
                <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3 text-center">
                    <p className="text-2xl font-black text-emerald-400">{stats.valid}</p>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-400/70">Valid</p>
                </div>
                <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3 text-center">
                    <p className="text-2xl font-black text-amber-400">{stats.warnings}</p>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-amber-400/70">Warnings</p>
                </div>
                <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-3 text-center">
                    <p className="text-2xl font-black text-red-400">{stats.errors}</p>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-red-400/70">Errors</p>
                </div>
            </div>

            {/* Controls Row */}
            <div className="flex items-center justify-between gap-4 px-1">
                {/* Audience Tag */}
                <div className="flex items-center gap-2 flex-1">
                    <Tag className="w-4 h-4 text-primary shrink-0" />
                    <Input
                        placeholder="Auto-tag (e.g. google-import)"
                        value={importTag}
                        onChange={(e) => onImportTagChange(e.target.value)}
                        className="h-8 text-xs bg-background/50 border-border/40"
                    />
                </div>

                {/* Exclude Invalid Toggle */}
                <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                        Skip errors
                    </span>
                    <Switch
                        checked={excludeInvalid}
                        onCheckedChange={onExcludeInvalidChange}
                    />
                </div>
            </div>

            {/* Validation Table */}
            <ScrollArea className="w-full">
                <div className="max-h-[220px]">
                    <div className="rounded-xl border border-border/40 overflow-hidden">
                        {/* Header */}
                        <div className="grid grid-cols-[32px_1fr_1fr_1fr_1fr] gap-0 items-center bg-[#3d5a52] text-white text-[10px] uppercase font-bold tracking-wider px-3 py-2.5">
                            <span></span>
                            <span>Name</span>
                            <span>Phone</span>
                            <span>Email</span>
                            <span>Tags</span>
                        </div>

                        {/* Rows */}
                        <div className="divide-y divide-border/15">
                            {validatedRows.slice(0, 50).map((result, i) => {
                                const config = STATUS_CONFIG[result.status];
                                const Icon = config.icon;

                                return (
                                    <div
                                        key={i}
                                        className={`
                                            grid grid-cols-[32px_1fr_1fr_1fr_1fr] gap-0 items-center px-3 py-2
                                            text-[11px] transition-colors
                                            ${result.status === 'error' && excludeInvalid
                                                ? 'opacity-30 line-through'
                                                : ''
                                            }
                                            ${config.bg} hover:brightness-110
                                        `}
                                        title={result.reason || 'Valid'}
                                    >
                                        <div>
                                            <Icon className={`w-3.5 h-3.5 ${config.color}`} />
                                        </div>
                                        <div className="font-medium truncate pr-2">
                                            {result.row.name || <span className="italic text-muted-foreground">Unknown</span>}
                                        </div>
                                        <div className="font-mono text-muted-foreground truncate pr-2 flex items-center gap-2">
                                            {result.row.phone || '—'}
                                            {result.row.phone && duplicates.has(result.row.phone) && (
                                                <Badge
                                                    variant="secondary"
                                                    className="h-3.5 px-1 text-[8px] font-black uppercase bg-amber-500/20 text-amber-500 border-amber-500/30 shrink-0"
                                                >
                                                    Existing
                                                </Badge>
                                            )}
                                        </div>
                                        <div className="text-muted-foreground truncate pr-2">
                                            {result.row.email || '—'}
                                        </div>
                                        <div className="truncate">
                                            {result.row.tags ? (
                                                <div className="flex gap-1 flex-wrap">
                                                    {result.row.tags.split('|').slice(0, 2).map((tag, t) => (
                                                        <Badge key={t} variant="outline" className="text-[9px] px-1.5 py-0">
                                                            {tag}
                                                        </Badge>
                                                    ))}
                                                    {result.row.tags.split('|').length > 2 && (
                                                        <span className="text-[9px] text-muted-foreground">
                                                            +{result.row.tags.split('|').length - 2}
                                                        </span>
                                                    )}
                                                </div>
                                            ) : '—'}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Overflow indicator */}
                        {validatedRows.length > 50 && (
                            <div className="px-4 py-2 text-[10px] text-center text-muted-foreground bg-muted/20 font-bold">
                                Showing 50 of {validatedRows.length} rows
                            </div>
                        )}
                    </div>
                </div>
                <ScrollBar orientation="horizontal" />
                <ScrollBar orientation="vertical" />
            </ScrollArea>

            {/* Import Summary */}
            <div className="flex items-center justify-center gap-2 px-1 py-1">
                <Shield className="w-4 h-4 text-primary" />
                <span className="text-xs font-semibold text-muted-foreground">
                    {excludeInvalid
                        ? `${stats.valid + stats.warnings} contacts will be imported`
                        : `${stats.total} contacts will be imported (including ${stats.errors} with errors)`
                    }
                </span>
            </div>
        </div>
    );
}
