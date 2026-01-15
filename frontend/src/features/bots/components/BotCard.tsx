'use client';

import { useState } from 'react';
import { MoreVertical, QrCode, Power, Trash2, Smartphone } from 'lucide-react';
import Image from 'next/image';

import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { useBotQR, useConnectBot, useDisconnectBot, useDeleteBot, type BotListItem } from '@/features/bots';
import { cn } from '@/lib/utils';

interface BotCardProps {
    bot: BotListItem;
}

export function BotCard({ bot }: BotCardProps) {
    const [showQR, setShowQR] = useState(false);
    const { data: qrData, isFetching: isQRLoading } = useBotQR(bot.id);
    const { mutate: deleteBot } = useDeleteBot();
    const { mutate: disconnectBot } = useDisconnectBot();

    const handleQRClick = () => {
        setShowQR(true);
    };

    return (
        <>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <div className="flex flex-col space-y-1.5">
                        <CardTitle className="text-base font-medium">{bot.name}</CardTitle>
                        <CardDescription className="text-xs">
                            {bot.phoneNumber || 'Not connected'}
                        </CardDescription>
                    </div>
                    <div className={cn(
                        "h-2.5 w-2.5 rounded-full ring-2 ring-background",
                        bot.status === 'connected' ? "bg-green-500" :
                            bot.status === 'connecting' ? "bg-yellow-500 animate-pulse" : "bg-red-500"
                    )} title={bot.status} />
                </CardHeader>
                <CardContent className="pb-2">
                    <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                        <div className="flex items-center">
                            <Smartphone className="mr-1 h-3 w-3" />
                            {bot.status === 'connected' ? 'Online' : 'Offline'}
                        </div>
                        <div>
                            {bot.messageCount} msgs
                        </div>
                    </div>
                </CardContent>
                <CardFooter className="flex justify-between pt-2">
                    {bot.status !== 'connected' ? (
                        <Button variant="outline" size="sm" onClick={handleQRClick} className="w-full mr-2">
                            <QrCode className="mr-2 h-3 w-3" />
                            Connect
                        </Button>
                    ) : (
                        <Button variant="outline" size="sm" onClick={() => disconnectBot(bot.id)} className="w-full mr-2 text-destructive hover:text-destructive">
                            <Power className="mr-2 h-3 w-3" />
                            Disconnect
                        </Button>
                    )}

                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => deleteBot(bot.id)}>
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </CardFooter>
            </Card>

            {/* QR Code Dialog */}
            <Dialog open={showQR} onOpenChange={setShowQR}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Scan QR Code</DialogTitle>
                        <DialogDescription>
                            Open WhatsApp on your phone, go to Linked Devices, and scan this code.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex items-center justify-center p-6">
                        {qrData?.qrCode ? (
                            // Convert QR string to Image (TODO: Use a QR library, for now assume backend returns image URL or base64)
                            // Since the type says 'string', we need to check if it's base64 or raw data.
                            // For a real implementation we would use 'qrcode.react' package.
                            // Assuming backend returns base64 string for now.
                            <div className="relative h-64 w-64 border-2 border-primary/20 rounded-lg p-2">
                                <img
                                    src={qrData.qrCode}
                                    alt="Scan Me"
                                    className="h-full w-full object-contain"
                                />
                            </div>
                        ) : (
                            <div className="flex h-64 w-64 items-center justify-center rounded-lg border-2 border-dashed">
                                {isQRLoading ? (
                                    <div className="flex flex-col items-center gap-2">
                                        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                                        <span className="text-sm text-muted-foreground">Generating QR...</span>
                                    </div>
                                ) : (
                                    <div className="text-center">
                                        <QrCode className="mx-auto h-12 w-12 opacity-20" />
                                        <p className="mt-2 text-sm text-muted-foreground">Waiting for QR Code...</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}
