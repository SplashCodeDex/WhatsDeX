'use client';

import React, { useState, useCallback, useMemo, type ReactNode } from 'react';
import { Upload, FileText, ArrowLeft, ArrowRight, FolderUp, Link2, ShieldCheck, Rocket, Check } from 'lucide-react';
import Papa from 'papaparse';
import { useImportContacts } from '../../hooks/useContacts';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogTrigger,
} from '@/components/ui/dialog';

import { UploadStep } from './UploadStep';
import { MappingStep } from './MappingStep';
import { ValidationStep } from './ValidationStep';
import { ImportStep } from './ImportStep';
import {
    type WizardState,
    type TargetField,
    type FieldMapping,
    initialWizardState,
    autoMapHeaders,
    validateAllRows,
    buildCSVFromValidated,
    parseVCard,
    parseExcel,
    findMatchingProfile,
    getValidationStats,
} from './wizardUtils';

// ─── Step Definitions ─────────────────────────────────────────────
const STEPS: readonly { readonly id: number; readonly label: string; readonly icon: ReactNode }[] = [
    { id: 1, label: 'Upload', icon: <FolderUp className="w-4 h-4" /> },
    { id: 2, label: 'Map', icon: <Link2 className="w-4 h-4" /> },
    { id: 3, label: 'Validate', icon: <ShieldCheck className="w-4 h-4" /> },
    { id: 4, label: 'Import', icon: <Rocket className="w-4 h-4" /> },
] as const;

export function ImportContactsDialog(): ReactNode {
    const [open, setOpen] = useState(false);
    const [state, setState] = useState<WizardState>({ ...initialWizardState });
    const importMutation = useImportContacts();

    // ─── Reset ────────────────────────────────────────────────────
    const resetWizard = useCallback(() => {
        setState({ ...initialWizardState });
        importMutation.reset();
    }, [importMutation]);

    // ─── File Processing ──────────────────────────────────────────
    const handleFileAccepted = useCallback(async (file: File) => {
        const lowerName = file.name.toLowerCase();
        const isVCard = lowerName.endsWith('.vcf');
        const isExcel = lowerName.endsWith('.xlsx') || lowerName.endsWith('.xls');

        if (isVCard) {
            // Parse vCard
            const reader = new FileReader();
            reader.onload = (e) => {
                const result = e.target?.result;
                if (typeof result !== 'string') return;
                const data = parseVCard(result);
                const headers = data[0] || [];
                const mappings = autoMapHeaders(headers, data[1] || []);

                // Auto-detect profile
                const profile = findMatchingProfile(headers);
                const finalMappings = profile
                    ? mappings.map(m => ({ ...m, targetField: profile.mappings[m.csvHeader] || 'skip' }))
                    : mappings;

                setState(prev => ({
                    ...prev,
                    file,
                    fileType: 'vcf',
                    rawData: data,
                    headers,
                    mappings: finalMappings,
                }));
            };
            reader.readAsText(file);
        } else if (isExcel) {
            // Parse Excel
            try {
                const data = await parseExcel(file);
                const headers = data[0] || [];
                const mappings = autoMapHeaders(headers, data[1] || []);

                // Auto-detect profile
                const profile = findMatchingProfile(headers);
                const finalMappings = profile
                    ? mappings.map(m => ({ ...m, targetField: profile.mappings[m.csvHeader] || 'skip' }))
                    : mappings;

                setState(prev => ({
                    ...prev,
                    file,
                    fileType: 'excel',
                    rawData: data,
                    headers,
                    mappings: finalMappings,
                }));
            } catch (error) {
                console.error('Excel parsing error:', error);
            }
        } else {
            // Parse CSV with PapaParse
            Papa.parse(file, {
                header: false,
                skipEmptyLines: true,
                complete: (results: Papa.ParseResult<string[]>) => {
                    const data = results.data;
                    const headers = data[0] || [];
                    const mappings = autoMapHeaders(headers, data[1] || []);

                    // Auto-detect profile
                    const profile = findMatchingProfile(headers);
                    const finalMappings = profile
                        ? mappings.map(m => ({ ...m, targetField: profile.mappings[m.csvHeader] || 'skip' }))
                        : mappings;

                    setState(prev => ({
                        ...prev,
                        file,
                        fileType: 'csv',
                        rawData: data,
                        headers,
                        mappings: finalMappings,
                    }));
                },
                error: (error) => {
                    console.error('PapaParse error:', error);
                },
            });
        }
    }, []);

    const handleApplyMappings = useCallback((newMappings: readonly FieldMapping[]) => {
        setState(prev => ({ ...prev, mappings: newMappings }));
    }, []);

    const handleRemoveFile = useCallback(() => {
        setState(prev => ({
            ...prev,
            file: null,
            fileType: null,
            rawData: [],
            headers: [],
            mappings: [],
            validatedRows: [],
        }));
    }, []);

    // ─── Mapping Updates ──────────────────────────────────────────
    const handleUpdateMapping = useCallback((csvIndex: number, targetField: TargetField) => {
        setState(prev => ({
            ...prev,
            mappings: prev.mappings.map(m =>
                m.csvIndex === csvIndex ? { ...m, targetField } : m
            ),
        }));
    }, []);

    // ─── Navigation ───────────────────────────────────────────────
    const goToStep = useCallback((step: number) => {
        if (step === 3) {
            // Run validation when entering step 3
            const validated = validateAllRows(state.rawData, state.mappings);
            setState(prev => ({ ...prev, step, validatedRows: validated }));
        } else {
            setState(prev => ({ ...prev, step }));
        }
    }, [state.rawData, state.mappings]);

    // ─── Import ───────────────────────────────────────────────────
    const handleImport = useCallback(async () => {
        setState(prev => ({ ...prev, step: 4 }));

        const csvData = buildCSVFromValidated(
            state.validatedRows,
            state.importTag,
            state.excludeInvalid
        );

        try {
            await importMutation.mutateAsync(csvData);
        } catch {
            // Error handled by mutation state
        }
    }, [state.validatedRows, state.importTag, state.excludeInvalid, importMutation]);

    // ─── Computed Values ──────────────────────────────────────────
    const rowCount = Math.max(0, state.rawData.length - 1); // Minus header
    const hasMappedPhone = state.mappings.some(m => m.targetField === 'phone');
    const stats = state.validatedRows.length > 0 ? getValidationStats(state.validatedRows) : null;
    const importableCount = stats
        ? (state.excludeInvalid ? stats.valid + stats.warnings : stats.total)
        : 0;

    const canProceed = useMemo(() => {
        switch (state.step) {
            case 1: return !!state.file;
            case 2: return hasMappedPhone;
            case 3: return importableCount > 0;
            default: return false;
        }
    }, [state.step, state.file, hasMappedPhone, importableCount]);

    return (
        <Dialog open={open} onOpenChange={(isOpen) => {
            setOpen(isOpen);
            if (!isOpen) resetWizard();
        }}>
            <DialogTrigger asChild>
                <Button className="font-bold flex items-center gap-2">
                    <Upload className="w-4 h-4" /> Import Contacts
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[720px] border border-border/50 bg-background/95 backdrop-blur-xl overflow-hidden shadow-2xl p-0">
                {/* ─── Stepper Header ──────────────────────────────────── */}
                <div className="px-6 pt-6 pb-4 border-b border-border/30">
                    <div className="flex items-center gap-2 mb-5">
                        <FileText className="w-5 h-5 text-primary" />
                        <h2 className="text-lg font-black">Import Contacts</h2>
                    </div>

                    <div className="flex items-center justify-between">
                        {STEPS.map((s, i) => (
                            <React.Fragment key={s.id}>
                                <div className={`
                                    flex items-center gap-2 transition-all duration-300
                                    ${state.step === s.id
                                        ? 'text-primary scale-105'
                                        : state.step > s.id
                                            ? 'text-emerald-400'
                                            : 'text-muted-foreground/40'
                                    }
                                `}>
                                    <div className={`
                                        w-8 h-8 rounded-full flex items-center justify-center text-sm font-black
                                        transition-all duration-300
                                        ${state.step === s.id
                                            ? 'bg-primary/15 ring-2 ring-primary/30 shadow-lg shadow-primary/10'
                                            : state.step > s.id
                                                ? 'bg-emerald-500/15 ring-1 ring-emerald-500/30'
                                                : 'bg-muted/30'
                                        }
                                    `}>
                                        {state.step > s.id ? <Check className="w-4 h-4" /> : s.icon}
                                    </div>
                                    <span className="text-xs font-bold uppercase tracking-wider hidden sm:block">
                                        {s.label}
                                    </span>
                                </div>
                                {i < STEPS.length - 1 && (
                                    <div className={`
                                        flex-1 h-px mx-2 transition-colors duration-500
                                        ${state.step > s.id
                                            ? 'bg-emerald-500/40'
                                            : 'bg-border/30'
                                        }
                                    `} />
                                )}
                            </React.Fragment>
                        ))}
                    </div>
                </div>

                {/* ─── Step Content ────────────────────────────────────── */}
                <div className="px-6 py-5 min-h-[300px]">
                    {state.step === 1 && (
                        <UploadStep
                            file={state.file}
                            fileType={state.fileType}
                            rowCount={rowCount}
                            onFileAccepted={handleFileAccepted}
                            onRemoveFile={handleRemoveFile}
                        />
                    )}
                    {state.step === 2 && (
                        <MappingStep
                            mappings={state.mappings}
                            onUpdateMapping={handleUpdateMapping}
                            onApplyMappings={handleApplyMappings}
                        />
                    )}
                    {state.step === 3 && (
                        <ValidationStep
                            validatedRows={state.validatedRows}
                            importTag={state.importTag}
                            onImportTagChange={(tag) => setState(prev => ({ ...prev, importTag: tag }))}
                            excludeInvalid={state.excludeInvalid}
                            onExcludeInvalidChange={(v) => setState(prev => ({ ...prev, excludeInvalid: v }))}
                        />
                    )}
                    {state.step === 4 && (
                        <ImportStep
                            isPending={importMutation.isPending}
                            isSuccess={importMutation.isSuccess}
                            isError={importMutation.isError}
                            error={importMutation.error instanceof Error ? importMutation.error : null}
                            importedCount={importMutation.isSuccess ? (importMutation.data?.count ?? 0) : 0}
                            totalCount={importableCount}
                            onRetry={() => goToStep(3)}
                            onClose={() => { setOpen(false); resetWizard(); }}
                        />
                    )}
                </div>

                {/* ─── Footer Navigation ──────────────────────────────── */}
                {state.step < 4 && (
                    <DialogFooter className="flex items-center justify-between gap-3 px-6 pb-6 pt-2 border-t border-border/20">
                        <div>
                            {state.step > 1 && (
                                <Button
                                    variant="ghost"
                                    onClick={() => goToStep(state.step - 1)}
                                    className="font-bold uppercase tracking-widest text-[11px] h-10 gap-2"
                                >
                                    <ArrowLeft className="w-3.5 h-3.5" />
                                    Back
                                </Button>
                            )}
                        </div>
                        <div className="flex items-center gap-3">
                            <Button
                                variant="outline"
                                onClick={() => { setOpen(false); resetWizard(); }}
                                className="font-bold uppercase tracking-widest text-[11px] h-10 px-6 border-border/50 hover:bg-muted"
                            >
                                Cancel
                            </Button>
                            {state.step < 3 ? (
                                <Button
                                    onClick={() => goToStep(state.step + 1)}
                                    disabled={!canProceed}
                                    className="h-10 px-8 font-bold uppercase tracking-widest text-[11px] shadow-xl shadow-primary/20 bg-primary text-primary-foreground hover:opacity-90 active:scale-95 transition-all gap-2"
                                >
                                    Next
                                    <ArrowRight className="w-3.5 h-3.5" />
                                </Button>
                            ) : (
                                <Button
                                    onClick={handleImport}
                                    disabled={!canProceed}
                                    className="h-10 px-10 font-bold uppercase tracking-widest text-[11px] shadow-xl shadow-emerald-500/20 bg-emerald-500 text-white hover:bg-emerald-600 active:scale-95 transition-all gap-2"
                                >
                                    <Upload className="w-3.5 h-3.5" />
                                    Import {importableCount} Contacts
                                </Button>
                            )}
                        </div>
                    </DialogFooter>
                )}
            </DialogContent>
        </Dialog>
    );
}
