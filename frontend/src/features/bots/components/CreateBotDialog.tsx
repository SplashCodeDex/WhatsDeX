'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Plus } from 'lucide-react';
import { logger } from '@/lib/logger';

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
import { useCreateBot, createBotSchema, type CreateBotInput, useBots } from '@/features/bots';
import { useSubscription } from '@/features/billing';

export function CreateBotDialog() {
    const [open, setOpen] = useState(false);
    const { data: bots } = useBots();
    const { limits, isAtLimit, isLoading: isLoadingPlan } = useSubscription();
    const { mutateAsync: createBot, isPending } = useCreateBot();
    
    const reachedLimit = bots && !isLoadingPlan ? isAtLimit(bots.length) : false;

    const {
        register,
        handleSubmit,
        reset,
        setError,
        formState: { errors },
    } = useForm<CreateBotInput>({
        resolver: zodResolver(createBotSchema),
    });

    const onSubmit = async (data: CreateBotInput) => {
        if (reachedLimit) return;
        
        try {
            await createBot(data);
            setOpen(false);
            reset();
        } catch (err: any) {
            logger.error('Failed to create bot', { error: err });
            // Error is already handled by mutation throw, but we catch here to set form error
            setError('root', {
                type: 'manual',
                message: err.message || 'Failed to create bot. Please try again.',
            });
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button disabled={reachedLimit}>
                    <Plus className="mr-2 h-4 w-4" />
                    {reachedLimit ? 'Limit Reached' : 'Create Bot'}
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <form onSubmit={handleSubmit(onSubmit)}>
                    <DialogHeader>
                        <DialogTitle>Create New Bot</DialogTitle>
                        <DialogDescription>
                            {reachedLimit 
                                ? `You have reached your limit of ${limits?.maxBots} bots. Upgrade your plan to add more.`
                                : "Add a new WhatsApp bot instance. You'll be able to scan the QR code to connect it in the next step."
                            }
                        </DialogDescription>
                    </DialogHeader>
                    {errors.root && (
                        <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
                            {errors.root.message}
                        </div>
                    )}
                    {!reachedLimit && (
                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label htmlFor="name">Bot Name</Label>
                                <Input
                                    id="name"
                                    placeholder="My Business Bot"
                                    disabled={isPending}
                                    error={!!errors.name}
                                    {...register('name')}
                                />
                                {errors.name && (
                                    <p className="text-sm text-destructive">{errors.name.message}</p>
                                )}
                            </div>
                        </div>
                    )}
                    <DialogFooter>
                        {reachedLimit ? (
                            <Button type="button" className="w-full" onClick={() => {
                                setOpen(false);
                                // Logic to redirect to billing or open upgrade modal
                            }}>
                                Upgrade Plan
                            </Button>
                        ) : (
                            <Button type="submit" disabled={isPending}>
                                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Create Bot
                            </Button>
                        )}
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
