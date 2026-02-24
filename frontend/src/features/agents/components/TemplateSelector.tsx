'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/features/auth';
import { AGENT_TEMPLATES } from '../data/templates';
import { type AgentTemplate, type PlanTier } from '../types';
import { cn } from '@/lib/utils';
import { Sparkles, Lock } from 'lucide-react';

interface TemplateSelectorProps {
    onSelect: (template: AgentTemplate) => void;
    className?: string;
}

const TIER_ORDER: Record<PlanTier, number> = {
    starter: 0,
    pro: 1,
    enterprise: 2,
};

/**
 * UI Component for selecting an Agent Template.
 * Displays "Premium" badges for templates requiring a higher tier than the user's current plan.
 */
export function TemplateSelector({ onSelect, className }: TemplateSelectorProps) {
    const { user } = useAuth();
    const userTier = user?.plan || 'starter';
    const userTierRank = TIER_ORDER[userTier];

    return (
        <div className={cn("grid gap-4 md:grid-cols-3", className)}>
            {AGENT_TEMPLATES.map((template) => {
                const requiredTierRank = TIER_ORDER[template.requiredTier];
                const isLocked = requiredTierRank > userTierRank;

                return (
                    <button
                        key={template.id}
                        onClick={() => onSelect(template)}
                        className="text-left transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] group"
                    >
                        <Card className={cn(
                            "h-full border-border/50 bg-card overflow-hidden relative",
                            isLocked ? "opacity-80" : "hover:border-primary/50"
                        )}>
                            <div className={cn(
                                "h-1.5 w-full bg-gradient-to-r",
                                template.requiredTier === 'starter' ? "from-blue-500 to-cyan-400" :
                                    template.requiredTier === 'pro' ? "from-primary-600 to-primary-400" :
                                        "from-purple-600 to-pink-500"
                            )} />

                            <CardHeader className="pb-2">
                                <div className="flex justify-between items-start">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted text-2xl shadow-inner">
                                        {template.emoji}
                                    </div>
                                    {isLocked && (
                                        <Badge variant="secondary" className="bg-amber-500/10 text-amber-600 border-amber-500/20 gap-1">
                                            <Lock className="h-3 w-3" />
                                            {template.requiredTier.toUpperCase()}
                                        </Badge>
                                    )}
                                    {!isLocked && template.requiredTier !== 'starter' && (
                                        <Badge variant="default" className="gap-1">
                                            <Sparkles className="h-3 w-3" />
                                            {template.requiredTier.toUpperCase()}
                                        </Badge>
                                    )}
                                </div>
                                <CardTitle className="mt-4 flex items-center gap-2">
                                    {template.title}
                                </CardTitle>
                                <CardDescription className="line-clamp-2">
                                    {template.description}
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest mt-auto">
                                Default: {template.suggestedModel}
                            </CardContent>
                        </Card>
                    </button>
                );
            })}
        </div>
    );
}
