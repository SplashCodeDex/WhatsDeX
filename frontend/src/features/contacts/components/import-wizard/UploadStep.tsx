'use client';

import React, { useCallback, useState } from 'react';
import { Upload, FileText, Download, FileSpreadsheet, Contact } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { downloadSampleCSV, type WizardState } from './wizardUtils';

interface UploadStepProps {
    readonly onFileAccepted: (file: File) => void;
    readonly file: WizardState['file'];
    readonly fileType: WizardState['fileType'];
    readonly rowCount: number;
    readonly onRemoveFile: () => void;
}

export function UploadStep({ onFileAccepted, file, fileType, rowCount, onRemoveFile }: UploadStepProps): React.ReactNode {
    const [isDragging, setIsDragging] = useState(false);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const droppedFile = e.dataTransfer.files[0];
        const lowerName = droppedFile?.name.toLowerCase();
        if (droppedFile && lowerName && (lowerName.endsWith('.csv') || lowerName.endsWith('.vcf') || lowerName.endsWith('.xlsx') || lowerName.endsWith('.xls'))) {
            onFileAccepted(droppedFile);
        }
    }, [onFileAccepted]);

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback(() => {
        setIsDragging(false);
    }, []);

    const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            onFileAccepted(selectedFile);
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            {!file ? (
                <>
                    {/* Drag & Drop Zone */}
                    <div
                        onDrop={handleDrop}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        className={`
                            relative border-2 border-dashed rounded-2xl p-12
                            flex flex-col items-center justify-center gap-5
                            transition-all duration-300 cursor-pointer group
                            ${isDragging
                                ? 'border-primary bg-primary/10 scale-[1.02] shadow-lg shadow-primary/10'
                                : 'border-border/50 hover:border-primary/50 hover:bg-primary/5'
                            }
                        `}
                    >
                        <input
                            type="file"
                            accept=".csv,.vcf,.xlsx,.xls"
                            onChange={handleFileInput}
                            className="absolute inset-0 opacity-0 cursor-pointer z-10"
                        />
                        <div className={`
                            p-5 rounded-2xl transition-all duration-300
                            ${isDragging
                                ? 'bg-primary/20 text-primary scale-110 rotate-6'
                                : 'bg-primary/10 text-primary group-hover:scale-110'
                            }
                        `}>
                            <Upload className="w-10 h-10" />
                        </div>
                        <div className="text-center space-y-2">
                            <p className="font-bold text-lg">
                                {isDragging ? 'Drop it right here' : 'Drag & Drop or Click to Browse'}
                            </p>
                            <p className="text-xs text-muted-foreground font-medium">
                                Supports <Badge variant="outline" className="text-[10px] ml-1 uppercase">.CSV</Badge>
                                <Badge variant="outline" className="text-[10px] ml-1 uppercase">.vCard</Badge>
                                <Badge variant="outline" className="text-[10px] ml-1 uppercase">.Excel</Badge>
                                <span className="ml-2 font-black">•</span>
                                <span className="ml-2 font-black">Max 5MB</span>
                            </p>
                        </div>
                    </div>

                    {/* Download Template */}
                    <div className="flex items-center justify-center">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => { e.stopPropagation(); downloadSampleCSV(); }}
                            className="text-xs text-muted-foreground hover:text-primary gap-2 font-semibold"
                        >
                            <Download className="w-3.5 h-3.5" />
                            Download Sample Template
                        </Button>
                    </div>
                </>
            ) : (
                /* File Info Card */
                <div className="rounded-2xl border border-primary/20 bg-primary/5 p-6 animate-in fade-in zoom-in-95 duration-300">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="p-3 rounded-xl bg-primary/10 text-primary">
                                {fileType === 'vcf' ? (
                                    <Contact className="w-7 h-7" />
                                ) : (
                                    <FileSpreadsheet className="w-7 h-7" />
                                )}
                            </div>
                            <div>
                                <p className="font-bold text-sm truncate max-w-[250px]">{file.name}</p>
                                <div className="flex items-center gap-3 mt-1">
                                    <Badge variant="outline" className="text-[10px] uppercase font-black">
                                        {fileType === 'vcf' ? 'vCard' : fileType === 'excel' ? 'Excel' : 'CSV'}
                                    </Badge>
                                    <span className="text-[10px] text-muted-foreground font-bold">
                                        {(file.size / 1024).toFixed(1)} KB
                                    </span>
                                    <span className="text-[10px] text-muted-foreground font-bold">
                                        {rowCount} contacts found
                                    </span>
                                </div>
                            </div>
                        </div>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={onRemoveFile}
                            className="text-muted-foreground hover:text-destructive text-xs"
                        >
                            Remove
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}
