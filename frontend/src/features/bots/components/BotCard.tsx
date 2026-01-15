'use client';

import { useState } from 'react';
import { Power, QrCode, Smartphone, Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { BotConnectDialog } from './BotConnectDialog';
import { useDeleteBot, useDisconnectBot, type BotListItem } from '@/features/bots';
import { cn } from '@/lib/utils';

interface BotCardProps {
    bot: BotListItem;
}

export function BotCard({ bot }: BotCardProps) {
    const [showQR, setShowQR] = useState(false);
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
                            {bot.phoneNumber || (bot.status === 'connected' ? 'Connected' : 'Not connected')}
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

            {/* Connect Bot Dialog */}
            <BotConnectDialog
                bot={bot}
                open={showQR}
                onOpenChange={setShowQR}
            />
        </>
    );
}
