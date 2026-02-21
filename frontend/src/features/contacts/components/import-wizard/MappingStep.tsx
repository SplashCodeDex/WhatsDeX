'use client';

import React, { type ReactNode } from 'react';
import { ArrowRight, Wand2, Eye, User, Phone, Mail, Tag, SkipForward } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import {
    type FieldMapping,
    type TargetField,
    type MappingProfile,
    getMappingProfiles,
    saveMappingProfile,
    deleteMappingProfile,
} from './wizardUtils';
import { toast } from 'sonner';
import { Save, FolderHeart, Trash2, Plus } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface MappingStepProps {
    readonly mappings: readonly FieldMapping[];
    readonly onUpdateMapping: (csvIndex: number, targetField: TargetField) => void;
    readonly onApplyMappings: (newMappings: readonly FieldMapping[]) => void;
}

const TARGET_FIELD_OPTIONS: readonly { readonly value: TargetField; readonly label: string; readonly icon: ReactNode; readonly color: string }[] = [
    { value: 'name', label: 'Name', icon: <User className="w-3.5 h-3.5" />, color: 'text-blue-400' },
    { value: 'phone', label: 'Phone', icon: <Phone className="w-3.5 h-3.5" />, color: 'text-emerald-400' },
    { value: 'email', label: 'Email', icon: <Mail className="w-3.5 h-3.5" />, color: 'text-amber-400' },
    { value: 'tags', label: 'Tags', icon: <Tag className="w-3.5 h-3.5" />, color: 'text-purple-400' },
    { value: 'skip', label: 'Skip', icon: <SkipForward className="w-3.5 h-3.5" />, color: 'text-muted-foreground' },
] as const;

function getFieldBadgeColor(field: TargetField): string {
    const colors: Record<TargetField, string> = {
        name: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
        phone: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
        email: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
        tags: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
        skip: 'bg-muted/50 text-muted-foreground border-border/50',
    } as const;
    return colors[field];
}

export function MappingStep({ mappings, onUpdateMapping, onApplyMappings }: MappingStepProps): ReactNode {
    const [profiles, setProfiles] = React.useState<MappingProfile[]>([]);
    const [isSaving, setIsSaving] = React.useState(false);
    const [newProfileName, setNewProfileName] = React.useState('');

    React.useEffect(() => {
        setProfiles(getMappingProfiles());
    }, []);

    const handleSaveProfile = () => {
        if (!newProfileName.trim()) {
            toast.error('Please enter a profile name');
            return;
        }
        saveMappingProfile(newProfileName.trim(), mappings);
        setProfiles(getMappingProfiles());
        setNewProfileName('');
        setIsSaving(false);
        toast.success(`Profile "${newProfileName}" saved`);
    };

    const handleApplyProfile = (profileId: string) => {
        const profile = profiles.find(p => p.id === profileId);
        if (!profile) return;

        const newMappings = mappings.map(m => ({
            ...m,
            targetField: profile.mappings[m.csvHeader] || 'skip'
        }));

        onApplyMappings(newMappings);
        toast.success(`Applied profile: ${profile.name}`);
    };

    const handleDeleteProfile = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        deleteMappingProfile(id);
        setProfiles(getMappingProfiles());
        toast.success('Profile deleted');
    };

    const mappedCount = mappings.filter(m => m.targetField !== 'skip').length;

    return (
        <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
            {/* Profiles & Summary */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-muted/30 p-4 rounded-xl border border-border/40">
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                        <Wand2 className="w-4 h-4 text-primary" />
                        <span className="text-sm font-semibold">
                            Auto-mapped <span className="text-primary font-black">{mappedCount}</span>
                        </span>
                    </div>

                    <div className="h-4 w-px bg-border/40" />

                    {/* Profile Selector */}
                    <div className="flex items-center gap-2">
                        <FolderHeart className="w-3.5 h-3.5 text-muted-foreground" />
                        <Select onValueChange={handleApplyProfile}>
                            <SelectTrigger className="h-8 min-w-[140px] text-[11px] font-bold bg-background/50 border-border/40">
                                <SelectValue placeholder="Load Profile..." />
                            </SelectTrigger>
                            <SelectContent>
                                {profiles.length === 0 ? (
                                    <div className="p-2 text-[10px] text-muted-foreground text-center">No saved profiles</div>
                                ) : (
                                    profiles.map(p => (
                                        <SelectItem key={p.id} value={p.id} className="text-[11px]">
                                            {p.name}
                                        </SelectItem>
                                    ))
                                )}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {isSaving ? (
                        <div className="flex items-center gap-2 animate-in fade-in slide-in-from-right-2 duration-300">
                            <Input
                                value={newProfileName}
                                onChange={(e) => setNewProfileName(e.target.value)}
                                placeholder="Profile name..."
                                className="h-8 text-[11px] w-32 bg-background/50"
                                autoFocus
                                onKeyDown={(e) => e.key === 'Enter' && handleSaveProfile()}
                            />
                            <Button size="sm" className="h-8 px-3 text-[10px] font-black uppercase" onClick={handleSaveProfile}>
                                Save
                            </Button>
                            <Button size="sm" variant="ghost" className="h-8 px-2 text-[10px] font-bold" onClick={() => setIsSaving(false)}>
                                Cancel
                            </Button>
                        </div>
                    ) : (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setIsSaving(true)}
                            className="h-8 text-[10px] font-black uppercase tracking-tight gap-1.5 border-dashed border-primary/40 hover:border-primary/60 hover:bg-primary/5"
                        >
                            <Save className="w-3 h-3 text-primary" />
                            Save as Profile
                        </Button>
                    )}
                </div>
            </div>

            {/* Mapping Table */}
            <ScrollArea className="w-full">
                <div className="max-h-[350px]">
                    <div className="rounded-xl border border-border/40 overflow-hidden">
                        {/* Header */}
                        <div className="grid grid-cols-[1fr_40px_1fr_1fr] gap-0 items-center bg-[#3d5a52] text-white text-[10px] uppercase font-bold tracking-wider px-4 py-3">
                            <span className="pl-2">CSV Column</span>
                            <span></span>
                            <span>Maps To</span>
                            <span className="flex items-center gap-1"><Eye className="w-3 h-3" /> Preview</span>
                        </div>

                        {/* Rows */}
                        <div className="divide-y divide-border/20">
                            {mappings.map((mapping) => (
                                <div
                                    key={mapping.csvIndex}
                                    className={`
                                        grid grid-cols-[1fr_40px_1fr_1fr] gap-0 items-center px-4 py-3
                                        transition-colors duration-200
                                        ${mapping.targetField === 'skip'
                                            ? 'bg-background/30 opacity-60'
                                            : 'bg-background/60 hover:bg-primary/5'
                                        }
                                    `}
                                >
                                    {/* CSV Header */}
                                    <div className="pl-2">
                                        <span className="font-mono text-xs font-bold truncate block max-w-[140px]">
                                            {mapping.csvHeader}
                                        </span>
                                    </div>

                                    {/* Arrow */}
                                    <div className="flex justify-center">
                                        <ArrowRight className={`w-3.5 h-3.5 ${mapping.targetField === 'skip'
                                            ? 'text-muted-foreground/30'
                                            : 'text-primary'
                                            }`} />
                                    </div>

                                    {/* Target Field Select */}
                                    <div>
                                        <Select
                                            value={mapping.targetField}
                                            onValueChange={(value: TargetField) =>
                                                onUpdateMapping(mapping.csvIndex, value)
                                            }
                                        >
                                            <SelectTrigger className={`
                                                h-8 text-xs font-bold border
                                                ${getFieldBadgeColor(mapping.targetField)}
                                            `}>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {TARGET_FIELD_OPTIONS.map(opt => (
                                                    <SelectItem key={opt.value} value={opt.value} className="text-xs">
                                                        <span className="flex items-center gap-1.5">{opt.icon} {opt.label}</span>
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    {/* Sample Value */}
                                    <div className="pl-3">
                                        <span className="text-[11px] text-muted-foreground font-mono truncate block max-w-[140px]">
                                            {mapping.sampleValue || '—'}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
                <ScrollBar orientation="vertical" />
            </ScrollArea>
        </div>
    );
}
