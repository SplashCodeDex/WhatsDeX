'use client';

import { Sparkles, Lock } from 'lucide-react';
import React from 'react';

import { AGENT_TEMPLATES } from '../data/templates';
import { type AgentTemplate, type PlanTier } from '../types';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getIcon } from '@/lib/icons';
import { cn } from '@/lib/utils';
import { useAuthorityStore } from '@/stores/useAuthorityStore';

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
 * Delegates to useAuthorityStore for the authoritative tier.
 */
export function TemplateSelector({ onSelect, className }: TemplateSelectorProps): React.JSX.Element {
    const { tier: userTier } = useAuthorityStore();
    const userTierRank = TIER_ORDER[userTier as PlanTier] || 0;

    return (
        <div className={cn("grid gap-4 md:grid-cols-3", className)}>
            {AGENT_TEMPLATES.map((template) => {
                const requiredTierRank = TIER_ORDER[template.requiredTier];
                const isLocked = requiredTierRank > userTierRank;

                return (
                    <button
                        key={template.id}
                        disabled={isLocked}
                        onClick={() => onSelect(template)}
                        className={cn(
                            "text-left transition-all duration-300 group",
                            isLocked ? "cursor-not-allowed" : "hover:scale-[1.02] active:scale-[0.98]"
                        )}
                    >
                        <Card className={cn(
                            "h-full border-border/50 bg-card overflow-hidden relative",
                            isLocked ? "opacity-60 grayscale-[0.5]" : "hover:border-primary/50"
                        )}>
                            <div className={cn(
                                "h-1.5 w-full bg-gradient-to-r",
                                template.requiredTier === 'starter' ? "from-blue-500 to-cyan-400" :
                                    template.requiredTier === 'pro' ? "from-primary-600 to-primary-400" :
                                        "from-purple-600 to-pink-500"
                            )} />

                            <CardHeader className="pb-2">
                                <div className="flex justify-between items-start">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted shadow-inner">
                                        {getIcon(template.iconName)}
                                    </div>
                                    {isLocked ? <Badge variant="secondary" className="bg-amber-500/10 text-amber-600 border-amber-500/20 gap-1">
                                            <Lock className="h-3 w-3" />
                                            {template.requiredTier.toUpperCase()}
                                        </Badge> : null}
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
