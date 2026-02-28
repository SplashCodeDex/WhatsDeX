'use client';

import { useActionState, useEffect, useState } from 'react';
import { Loader2, Plus } from 'lucide-react';
import { toast } from 'sonner';

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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { createBot, useBots } from '@/features/bots';
import { useSubscription } from '@/features/billing';

interface CreateBotDialogProps {
    agentId?: string;
}

export function CreateBotDialog({ agentId = 'system_default' }: CreateBotDialogProps) {
    const [open, setOpen] = useState(false);
    const [botType, setBotType] = useState('whatsapp');
    const { data: bots } = useBots(agentId);
    const { limits, isAtLimit, isLoading: isLoadingPlan } = useSubscription();

    const [state, formAction, isPending] = useActionState(createBot, null);

    const reachedLimit = bots && !isLoadingPlan ? isAtLimit(bots.length) : false;

    useEffect(() => {
        if (state?.success) {
            setOpen(false);
            setBotType('whatsapp'); // Reset
            toast.success('Bot created successfully');
        }
    }, [state]);

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button disabled={reachedLimit}>
                    <Plus className="mr-2 h-4 w-4" />
                    {reachedLimit ? 'Limit Reached' : 'Create Bot'}
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <form action={formAction}>
                    <input type="hidden" name="type" value={botType} />
                    <input type="hidden" name="agentId" value={agentId} />
                    <DialogHeader>
                        <DialogTitle>Create New Bot</DialogTitle>
                        <DialogDescription>
                            {reachedLimit
                                ? `You have reached your limit of ${limits?.maxBots} bots. Upgrade your plan to add more.`
                                : "Add a new bot instance. Choose the platform and follow the setup instructions."
                            }
                        </DialogDescription>
                    </DialogHeader>

                    <div className="py-4 space-y-4">
                        {!reachedLimit && (
                            <>
                                <div className="space-y-2">
                                    <Label htmlFor="type">Platform</Label>
                                    <Select onValueChange={setBotType} value={botType}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select platform" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="whatsapp">WhatsApp (QR Code)</SelectItem>
                                            <SelectItem value="telegram">Telegram (Bot Token)</SelectItem>
                                            <SelectItem value="discord">Discord (Bot Token)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="name">Bot Name</Label>
                                    <Input
                                        id="name"
                                        name="name"
                                        placeholder="e.g. Support Bot"
                                        disabled={isPending}
                                        required
                                    />
                                    {state?.success === false && !!(state.error as any).details?.name && (
                                        <p className="text-xs text-destructive">
                                            {(Array.isArray((state.error as any).details.name)
                                                ? (state.error as any).details.name[0]
                                                : (state.error as any).details.name) as string}
                                        </p>
                                    )}
                                </div>

                                {botType !== 'whatsapp' && (
                                    <div className="space-y-2 animate-in slide-in-from-top-2 duration-200">
                                        <Label htmlFor="token">API Token</Label>
                                        <Input
                                            id="token"
                                            name="token"
                                            type="password"
                                            placeholder={botType === 'telegram' ? '123456:ABC-DEF...' : 'MTA...'}
                                            disabled={isPending}
                                            required
                                        />
                                        <p className="text-[10px] text-muted-foreground">
                                            {botType === 'telegram' 
                                                ? "Get this from @BotFather on Telegram." 
                                                : "Get this from the Discord Developer Portal."}
                                        </p>
                                    </div>
                                )}
                            </>
                        )}

                        {state?.success === false && !state.error.details?.name && (
                            <p className="text-sm text-destructive text-center font-medium">
                                {state.error.message}
                            </p>
                        )}
                    </div>

                    <DialogFooter>
                        {reachedLimit ? (
                            <Button type="button" className="w-full" onClick={() => setOpen(false)}>
                                Upgrade Plan
                            </Button>
                        ) : (
                            <Button type="submit" isLoading={isPending} disabled={isPending} className="w-full">
                                Create {botType === 'whatsapp' ? 'WhatsApp' : botType.charAt(0).toUpperCase() + botType.slice(1)} Bot
                            </Button>
                        )}
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
