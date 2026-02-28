'use client';

import { Bot } from 'lucide-react';

import { useBots } from '@/features/bots';
import { CreateBotDialog } from './CreateBotDialog';
import { BotCard } from './BotCard';

interface BotListProps {
    agentId?: string;
}

export function BotList({ agentId = 'system_default' }: BotListProps) {
    const { data: bots, isLoading, error } = useBots(agentId);

    if (isLoading) {
        return (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="h-[200px] rounded-xl border bg-card/50 p-6 animate-pulse" />
                ))}
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex h-[450px] flex-col items-center justify-center rounded-lg border border-dashed text-center">
                <Bot className="h-10 w-10 text-muted-foreground/50" />
                <h3 className="mt-4 text-lg font-semibold">Error Loading Bots</h3>
                <p className="mt-2 text-sm text-muted-foreground max-w-sm">
                    {error instanceof Error ? error.message : 'Something went wrong while fetching your bots.'}
                </p>
            </div>
        );
    }

    if (!bots?.length) {
        return (
            <div className="flex h-[450px] flex-col items-center justify-center rounded-lg border border-dashed text-center animate-in fade-in-50">
                <div className="rounded-full bg-muted p-4">
                    <Bot className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="mt-4 text-lg font-semibold">No Bots Created</h3>
                <p className="mb-4 mt-2 text-sm text-muted-foreground max-w-sm text-balance">
                    You haven&apos;t created any WhatsApp bots yet. Create one to start automating your messages.
                </p>
                <CreateBotDialog agentId={agentId} />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Your Instances</h2>
                <CreateBotDialog agentId={agentId} />
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {bots.map((bot) => (
                    <BotCard key={bot.id} bot={bot} agentId={agentId} />
                ))}
            </div>
        </div>
    );
}
