'use client';

import React, { useState } from 'react';
import { Upload, FileText, AlertCircle, CheckCircle2, Loader2, X } from 'lucide-react';
import { useImportContacts } from '../hooks/useContacts';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';

export function ImportContactsDialog() {
    const [open, setOpen] = useState(false);
    const [file, setFile] = useState<File | null>(null);
    const [csvPreview, setCsvPreview] = useState<string>('');
    const importMutation = useImportContacts();

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            setFile(selectedFile);
            const reader = new FileReader();
            reader.onload = (event) => {
                const text = event.target?.result as string;
                setCsvPreview(text.split('\n').slice(0, 5).join('\n'));
            };
            reader.readAsText(selectedFile);
        }
    };

    const handleImport = async () => {
        if (!file) return;

        const formData = new FormData();
        formData.append('file', file);

        try {
            await importMutation.mutateAsync(formData);
            setOpen(false);
            setFile(null);
            setCsvPreview('');
        } catch (err) {
            // Error is handled by mutation state
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="font-bold flex items-center gap-2">
                    <Upload className="w-4 h-4" /> Import Contacts
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px] border border-border/50 bg-background/95 backdrop-blur-xl">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-black flex items-center gap-2">
                        <FileText className="w-6 h-6 text-primary" /> Import CSV
                    </DialogTitle>
                    <DialogDescription>
                        Upload a CSV file with headers (name, phone, email, tags).
                        Tags should be separated by a pipe (|).
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    {!file ? (
                        <div className="border-2 border-dashed border-border/50 rounded-2xl p-10 flex flex-col items-center justify-center gap-4 transition-all hover:border-primary/50 hover:bg-primary/5 group cursor-pointer relative">
                            <input
                                type="file"
                                accept=".csv"
                                onChange={handleFileChange}
                                className="absolute inset-0 opacity-0 cursor-pointer"
                            />
                            <div className="p-4 rounded-full bg-primary/10 text-primary group-hover:scale-110 transition-transform">
                                <Upload className="w-8 h-8" />
                            </div>
                            <div className="text-center">
                                <p className="font-bold">Select CSV File</p>
                                <p className="text-xs text-muted-foreground uppercase font-black tracking-widest mt-1">Max size 2MB</p>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between p-4 rounded-xl bg-primary/5 border border-primary/20">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-lg bg-primary/10 text-primary">
                                        <FileText className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="font-bold text-sm truncate max-w-[200px]">{file.name}</p>
                                        <p className="text-[10px] text-muted-foreground uppercase font-black">{(file.size / 1024).toFixed(1)} KB</p>
                                    </div>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => { setFile(null); setCsvPreview(''); }}
                                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                >
                                    <X className="w-4 h-4" />
                                </Button>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-[10px] uppercase font-black text-muted-foreground tracking-widest">Preview (Top 5 Rows)</Label>
                                <pre className="p-3 rounded-lg bg-zinc-950 border border-border/40 text-[10px] font-mono text-zinc-400 overflow-x-auto">
                                    {csvPreview}
                                </pre>
                            </div>
                        </div>
                    )}

                    {importMutation.isError && (
                        <Alert variant="destructive" className="bg-destructive/10 border-destructive/20 text-destructive-foreground">
                            <AlertCircle className="h-4 w-4" />
                            <AlertTitle>Import Failed</AlertTitle>
                            <AlertDescription className="text-xs">
                                {importMutation.error instanceof Error ? importMutation.error.message : 'Unknown error'}
                            </AlertDescription>
                        </Alert>
                    )}

                    {importMutation.isSuccess && (
                        <Alert className="bg-primary/10 border-primary/20 text-primary">
                            <CheckCircle2 className="h-4 w-4 text-primary" />
                            <AlertTitle>Success</AlertTitle>
                            <AlertDescription className="text-xs">
                                {importMutation.data.count} contacts imported successfully.
                            </AlertDescription>
                        </Alert>
                    )}
                </div>

                <DialogFooter className="gap-2 sm:gap-0">
                    <Button
                        variant="ghost"
                        onClick={() => setOpen(false)}
                        className="font-bold uppercase tracking-widest text-[10px]"
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleImport}
                        disabled={!file || importMutation.isPending}
                        className="px-8 font-bold uppercase tracking-widest text-[10px] shadow-lg shadow-primary/20"
                    >
                        {importMutation.isPending ? (
                            <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        ) : null}
                        Start Import
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

function Label({ children, className }: { children: React.ReactNode, className?: string }) {
    return <span className={className}>{children}</span>;
}
