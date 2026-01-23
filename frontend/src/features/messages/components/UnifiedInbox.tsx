'use client';

import React from 'react';
import { useMessageHistory } from '../hooks/useMessageHistory';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, MessageSquare, Send, User, Clock, AlertCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export function UnifiedInbox() {
    const { data: messages, isLoading, error } = useMessageHistory();

    if (isLoading) {
        return (
            <div className="flex items-center justify-center p-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center p-12 text-destructive gap-2">
                <AlertCircle className="h-10 w-10" />
                <p>Failed to load message history</p>
            </div>
        );
    }

    return (
        <Card className="border-border/40 bg-background/50 backdrop-blur-md">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5 text-primary" />
                    Unified Message History
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {messages?.map((msg) => (
                        <div key={msg.id} className="flex items-start gap-4 p-3 rounded-lg hover:bg-muted/30 transition-colors border border-transparent hover:border-border/50">
                            <div className="p-2 rounded-full bg-primary/10">
                                <Send className="h-4 w-4 text-primary" />
                            </div>
                            <div className="flex-1 space-y-1">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <span className="font-semibold text-sm flex items-center gap-1">
                                            <User className="h-3 w-3 text-muted-foreground" />
                                            {msg.to}
                                        </span>
                                        <Badge variant="outline" className="text-[10px] h-4">
                                            {msg.botId}
                                        </Badge>
                                    </div>
                                    <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                                        <Clock className="h-3 w-3" />
                                        {msg.timestamp ? formatDistanceToNow(new Date(msg.timestamp)) + ' ago' : 'Recently'}
                                    </span>
                                </div>
                                <p className="text-sm text-foreground/80 line-clamp-2">
                                    {msg.text}
                                </p>
                            </div>
                            <div className="flex items-center gap-1">
                                <Badge className={msg.status === 'sent' ? 'bg-blue-500/20 text-blue-500' : 'bg-green-500/20 text-green-500'}>
                                    {msg.status}
                                </Badge>
                            </div>
                        </div>
                    ))}

                    {messages?.length === 0 && (
                        <div className="text-center py-12 text-muted-foreground">
                            <p>No messages found in history.</p>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
