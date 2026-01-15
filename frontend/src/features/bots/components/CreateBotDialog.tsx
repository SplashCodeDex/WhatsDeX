'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Plus } from 'lucide-react';

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
import { useCreateBot, createBotSchema, type CreateBotInput } from '@/features/bots';

export function CreateBotDialog() {
    const [open, setOpen] = useState(false);
    const { mutateAsync: createBot, isPending } = useCreateBot();
    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm<CreateBotInput>({
        resolver: zodResolver(createBotSchema),
    });

    const onSubmit = async (data: CreateBotInput) => {
        try {
            await createBot(data);
            setOpen(false);
            reset();
        } catch {
            // Error handled by mutation hook or global toast (TODO)
            console.error('Failed to create bot');
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Bot
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <form onSubmit={handleSubmit(onSubmit)}>
                    <DialogHeader>
                        <DialogTitle>Create New Bot</DialogTitle>
                        <DialogDescription>
                            Add a new WhatsApp bot instance. You'll be able to scan the QR code to connect it in the next step.
                        </DialogDescription>
                    </DialogHeader>
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
                    <DialogFooter>
                        <Button type="submit" disabled={isPending}>
                            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Create Bot
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
