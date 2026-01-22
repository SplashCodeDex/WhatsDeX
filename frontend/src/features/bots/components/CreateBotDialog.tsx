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
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { FormError } from '@/components/ui/form-error';
import { useCreateBot, createBotSchema, type CreateBotInput, useBots } from '@/features/bots';
import { useSubscription } from '@/features/billing';

export function CreateBotDialog() {
    const [open, setOpen] = useState(false);
    const { data: bots } = useBots();
    const { limits, isAtLimit, isLoading: isLoadingPlan } = useSubscription();
    const { mutateAsync: createBot, isPending } = useCreateBot();

    const reachedLimit = bots && !isLoadingPlan ? isAtLimit(bots.length) : false;

    const form = useForm<CreateBotInput>({
        resolver: zodResolver(createBotSchema),
        defaultValues: {
            name: '',
        },
    });

    const onSubmit = async (data: CreateBotInput) => {
        if (reachedLimit) return;

        try {
            await createBot(data);
            setOpen(false);
            form.reset();
        } catch (err: any) {
            logger.error('Failed to create bot', { error: err });
            form.setError('root', {
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
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)}>
                        <DialogHeader>
                            <DialogTitle>Create New Bot</DialogTitle>
                            <DialogDescription>
                                {reachedLimit
                                    ? `You have reached your limit of ${limits?.maxBots} bots. Upgrade your plan to add more.`
                                    : "Add a new WhatsApp bot instance. You'll be able to scan the QR code to connect it in the next step."
                                }
                            </DialogDescription>
                        </DialogHeader>

                        <div className="py-4">
                            <FormError message={form.formState.errors.root?.message} />

                            {!reachedLimit && (
                                <FormField
                                    control={form.control}
                                    name="name"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Bot Name</FormLabel>
                                            <FormControl>
                                                <Input
                                                    placeholder="My Business Bot"
                                                    disabled={isPending}
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            )}
                        </div>

                        <DialogFooter>
                            {reachedLimit ? (
                                <Button type="button" className="w-full" onClick={() => {
                                    setOpen(false);
                                    // Logic to redirect to billing or open upgrade modal
                                }}>
                                    Upgrade Plan
                                </Button>
                            ) : (
                                <Button type="submit" isLoading={isPending}>
                                    Create Bot
                                </Button>
                            )}
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
