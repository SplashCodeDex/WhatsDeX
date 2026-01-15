'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod'; // Import zod from zod
import { zodResolver } from '@hookform/resolvers/zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'; // Assuming tabs exist
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { QRCodeDisplay } from './QRCodeDisplay'; // Reuse existing
import { Bot } from '../types';
import { useBotStatus, usePairingCode } from '../hooks/useBots'; // We need to add usePairingCode to hooks
import { CheckCircle2, Copy } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BotConnectDialogProps {
    bot: { id: string; name: string };
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

const pairingSchema = z.object({
    phoneNumber: z.string().min(10, 'Phone number required (e.g., 1234567890)')
});

type PairingForm = z.infer<typeof pairingSchema>;

export function BotConnectDialog({ bot, open, onOpenChange }: BotConnectDialogProps) {
    const [activeTab, setActiveTab] = useState<'qr' | 'code'>('qr');
    const { data: statusData } = useBotStatus(bot.id, open); // Poll status while open
    const { mutate: requestPairingCode, isPending: isRequestingCode, data: pairingCodeData, error: pairingError } = usePairingCode(bot.id);

    // Auto-close on connection
    useEffect(() => {
        if (statusData?.status === 'connected') {
            onOpenChange(false);
        }
    }, [statusData?.status, onOpenChange]);

    const { register, handleSubmit, formState: { errors } } = useForm<PairingForm>({
        resolver: zodResolver(pairingSchema),
        defaultValues: { phoneNumber: '' }
    });

    const onGetCode = (data: PairingForm) => {
        requestPairingCode(data.phoneNumber);
    };

    const copyCode = () => {
        if (pairingCodeData?.pairingCode) {
            navigator.clipboard.writeText(pairingCodeData.pairingCode);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Connect {bot.name}</DialogTitle>
                    <DialogDescription>
                        Link your WhatsApp account to start sending messages.
                    </DialogDescription>
                </DialogHeader>

                <Tabs value={activeTab} onValueChange={(v: string) => setActiveTab(v as 'qr' | 'code')}>
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="qr">QR Code</TabsTrigger>
                        <TabsTrigger value="code">Pairing Code</TabsTrigger>
                    </TabsList>

                    <div className="mt-4 h-[300px] flex flex-col items-center justify-center">
                        <TabsContent value="qr" className="w-full flex-1 flex flex-col items-center justify-center mt-0">
                            <div className="scale-90">
                                <QRCodeDisplay botId={bot.id} />
                            </div>
                            <p className="text-sm text-muted-foreground mt-2">Open WhatsApp &gt; Linked Devices &gt; Link a Device</p>
                        </TabsContent>

                        <TabsContent value="code" className="w-full flex-1 flex flex-col items-center mt-0 space-y-4">
                            {!pairingCodeData?.pairingCode ? (
                                <form onSubmit={handleSubmit(onGetCode)} className="w-full space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="phoneNumber">Phone Number</Label>
                                        <Input
                                            id="phoneNumber"
                                            placeholder="e.g. 2348000000000"
                                            {...register('phoneNumber')}
                                        />
                                        {errors.phoneNumber && <p className="text-xs text-red-500">{errors.phoneNumber.message}</p>}
                                        <p className="text-xs text-muted-foreground">Enter number with country code, no + symbol.</p>
                                    </div>

                                    {pairingError && <p className="text-sm text-red-500 bg-red-50 p-2 rounded">{pairingError.message}</p>}

                                    <Button type="submit" className="w-full" disabled={isRequestingCode}>
                                        {isRequestingCode ? 'Generating Code...' : 'Get Pairing Code'}
                                    </Button>
                                </form>
                            ) : (
                                <div className="flex flex-col items-center space-y-4 w-full animate-in fade-in zoom-in">
                                    <div className="text-center">
                                        <h3 className="text-lg font-medium text-muted-foreground">Your Pairing Code</h3>
                                        <div className="text-4xl font-mono tracking-widest font-bold my-4 bg-muted/50 p-4 rounded-lg select-all border border-primary/20">
                                            {pairingCodeData.pairingCode.split('').map((char: string, i: number) => (
                                                <span key={i} className={i === 4 ? 'ml-2' : ''}>{char}</span>
                                            ))}
                                        </div>
                                    </div>

                                    <Button variant="outline" size="sm" onClick={copyCode} className="gap-2">
                                        <Copy className="w-4 h-4" /> Copy Code
                                    </Button>

                                    <div className="bg-blue-50 text-blue-800 text-sm p-3 rounded-lg flex items-start gap-2">
                                        <CheckCircle2 className="w-4 h-4 mt-0.5" />
                                        <p>Enter this code on your phone notification to link device.</p>
                                    </div>
                                </div>
                            )}
                        </TabsContent>
                    </div>
                </Tabs>
            </DialogContent>
        </Dialog>
    );
}
