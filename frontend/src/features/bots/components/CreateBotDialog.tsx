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
import { createBot, useBots } from '@/features/bots';
import { useSubscription } from '@/features/billing';

export function CreateBotDialog() {
    const [open, setOpen] = useState(false);
    const { data: bots } = useBots();
    const { limits, isAtLimit, isLoading: isLoadingPlan } = useSubscription();

    const [state, formAction, isPending] = useActionState(createBot, null);

    const reachedLimit = bots && !isLoadingPlan ? isAtLimit(bots.length) : false;

    useEffect(() => {
        if (state?.success) {
            setOpen(false);
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
                    <DialogHeader>
                        <DialogTitle>Create New Bot</DialogTitle>
                        <DialogDescription>
                            {reachedLimit
                                ? `You have reached your limit of ${limits?.maxBots} bots. Upgrade your plan to add more.`
                                : "Add a new WhatsApp bot instance. You'll be able to scan the QR code to connect it in the next step."
                            }
                        </DialogDescription>
                    </DialogHeader>

                    <div className="py-4 space-y-4">
                        {!reachedLimit && (
                            <div className="space-y-2">
                                <Label htmlFor="name">Bot Name</Label>
                                <Input
                                    id="name"
                                    name="name"
                                    placeholder="My Business Bot"
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
                            <Button type="submit" isLoading={isPending} disabled={isPending}>
                                Create Bot
                            </Button>
                        )}
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
