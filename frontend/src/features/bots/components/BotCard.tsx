'use client';

import { useState } from 'react';
import * as Icons from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { BotConnectDialog, BotSettingsDialog } from './index';
import { useDeleteBot, useDisconnectBot, useBot, useConnectBot } from '../hooks/index';
import type { BotListItem } from '../types';
import { cn } from '@/lib/utils';

interface BotCardProps {
    bot: BotListItem;
}

const platformIcons: Record<string, any> = {
    whatsapp: Icons.Smartphone,
    telegram: Icons.Send,
    discord: Icons.MessageSquare,
    slack: Icons.MessageSquare,
    signal: Icons.Radio
};

export function BotCard({ bot }: BotCardProps) {
    const [showQR, setShowQR] = useState(false);
    const [showSettings, setShowSettings] = useState(false);

    // Fetch full bot data only when settings are open
    const { data: fullBot } = useBot(bot.id);

    const { mutate: deleteBot } = useDeleteBot();
    const { mutate: disconnectBot } = useDisconnectBot();
    const { mutate: connectBot } = useConnectBot();

    const handleConnectClick = () => {
        if (bot.type === 'whatsapp' || !bot.type) {
            setShowQR(true);
        } else {
            // For Telegram/Discord, just trigger start
            connectBot(bot.id);
        }
    };

    const PlatformIcon = platformIcons[bot.type || 'whatsapp'] || Icons.Smartphone;

    return (
        <>
            <Card className="overflow-hidden border-border/50">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <div className="flex flex-col space-y-1.5">
                        <div className="flex items-center gap-2">
                            <PlatformIcon className="h-3.5 w-3.5 text-muted-foreground" />
                            <CardTitle className="text-base font-medium">{bot.name}</CardTitle>
                        </div>
                        <CardDescription className="text-xs truncate max-w-[150px]">
                            {bot.phoneNumber || bot.identifier || (bot.status === 'connected' ? 'Connected' : 'Not connected')}
                        </CardDescription>
                    </div>
                    <div className={cn(
                        "h-2.5 w-2.5 rounded-full ring-2 ring-background",
                        bot.status === 'connected' ? "bg-green-500" :
                            bot.status === 'connecting' ? "bg-yellow-500" : "bg-red-500"
                    )} title={bot.status} />
                </CardHeader>
                <CardContent className="pb-2">
                    <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                        <div className="flex items-center">
                            <Badge variant="outline" className="text-[10px] py-0 h-4 capitalize">
                                {bot.type || 'whatsapp'}
                            </Badge>
                        </div>
                        <div>
                            {bot.messageCount} msgs
                        </div>
                    </div>
                </CardContent>
                <CardFooter className="flex justify-between pt-2 gap-2">
                    <div className="flex-1 flex gap-2">
                        {bot.status !== 'connected' ? (
                            <Button variant="outline" size="sm" onClick={handleConnectClick} className="flex-1">
                                {(bot.type === 'whatsapp' || !bot.type) ? <Icons.QrCode className="mr-2 h-3 w-3" /> : <Icons.Power className="mr-2 h-3 w-3" />}
                                Connect
                            </Button>
                        ) : (
                            <Button variant="outline" size="sm" onClick={() => disconnectBot(bot.id)} className="flex-1 text-destructive hover:text-destructive">
                                <Icons.Power className="mr-2 h-3 w-3" />
                                Disconnect
                            </Button>
                        )}

                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-primary"
                            onClick={() => setShowSettings(true)}
                            title="Bot Settings"
                        >
                            <Icons.Settings2 className="h-4 w-4" />
                        </Button>
                    </div>

                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={() => deleteBot(bot.id)}
                        title="Delete Bot"
                    >
                        <Icons.Trash2 className="h-4 w-4" />
                    </Button>
                </CardFooter>
            </Card>

            {/* Connect Bot Dialog (WhatsApp Only) */}
            {(bot.type === 'whatsapp' || !bot.type) && (
                <BotConnectDialog
                    bot={bot}
                    open={showQR}
                    onOpenChange={setShowQR}
                />
            )}

            {/* Bot Settings Dialog */}
            <BotSettingsDialog
                botId={bot.id}
                botType={bot.type}
                initialConfig={fullBot?.config}
                open={showSettings}
                onOpenChange={setShowSettings}
            />
        </>
    );
}
