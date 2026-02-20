'use client';

import React from 'react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/features/auth';
import { isSkillAllowed } from '../utils/SkillGating';
import { Lock, HelpCircle } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface Skill {
    id: string;
    name: string;
    description: string;
}

const AVAILABLE_SKILLS: Skill[] = [
    { id: 'basic_reply', name: 'Smart Reply', description: 'Basic conversational capability.' },
    { id: 'summarize', name: 'Summarization', description: 'Condense long chat histories.' },
    { id: 'web_search', name: 'Web Search', description: 'Real-time information from the internet.' },
    { id: 'file_analysis', name: 'File Analysis', description: 'Analyze PDF and text documents.' },
    { id: 'image_generation', name: 'Image Gen', description: 'Create AI images on the fly.' },
    { id: 'custom_scripting', name: 'Scripting', description: 'Execute custom code snippets.' },
];

interface SkillToggleProps {
    enabledSkills: string[];
    onToggle: (skillId: string, enabled: boolean) => void;
}

/**
 * UI Component for managing Agent Skills with tier-based gating.
 */
export function SkillToggle({ enabledSkills, onToggle }: SkillToggleProps) {
    const { user } = useAuth();
    const userTier = user?.planTier || 'starter';

    return (
        <TooltipProvider>
            <div className="grid gap-6 sm:grid-cols-2">
                {AVAILABLE_SKILLS.map((skill) => {
                    const isAllowed = isSkillAllowed(userTier, skill.id);
                    const isEnabled = enabledSkills.includes(skill.id);

                    return (
                        <div 
                            key={skill.id} 
                            className={cn(
                                "flex items-center justify-between space-x-4 rounded-xl border p-4 transition-all",
                                isAllowed ? "bg-card/50" : "bg-muted/30 opacity-70 grayscale-[0.5]"
                            )}
                        >
                            <div className="flex-1 space-y-1">
                                <div className="flex items-center gap-2">
                                    <Label 
                                        htmlFor={`skill-${skill.id}`}
                                        className={cn("text-sm font-semibold leading-none", !isAllowed && "text-muted-foreground")}
                                    >
                                        {skill.name}
                                    </Label>
                                    {!isAllowed && (
                                        <Lock className="h-3 w-3 text-amber-500" />
                                    )}
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <HelpCircle className="h-3 w-3 text-muted-foreground cursor-help" />
                                        </TooltipTrigger>
                                        <TooltipContent side="top" className="max-w-[200px] text-xs">
                                            {skill.description}
                                        </TooltipContent>
                                    </Tooltip>
                                </div>
                                {!isAllowed && (
                                    <p className="text-[10px] text-amber-600 font-medium uppercase tracking-tighter">
                                        Pro / Enterprise Only
                                    </p>
                                )}
                            </div>
                            <Switch
                                id={`skill-${skill.id}`}
                                checked={isAllowed && isEnabled}
                                onCheckedChange={(checked) => isAllowed && onToggle(skill.id, checked)}
                                disabled={!isAllowed}
                                className={cn(
                                    !isAllowed && "cursor-not-allowed opacity-50"
                                )}
                            />
                        </div>
                    );
                })}
            </div>
        </TooltipProvider>
    );
}
