'use client';

import React, { useState } from 'react';
import { useMessageHistory } from '../hooks/useMessageHistory';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
    Loader2, 
    MessageSquare, 
    Send, 
    User, 
    Clock, 
    AlertCircle, 
    Smartphone, 
    Send as SendIcon, 
    Zap,
    Bot,
    Reply
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import { api } from '@/lib/api/client';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export function UnifiedInbox() {
    const { data: messages, isLoading, error, refetch } = useMessageHistory();
    const [activeFilter, setActiveFilter] = useState<'all' | 'whatsapp' | 'telegram' | 'discord'>('all');
    const [replyingToId, setReplyToId] = useState<string | null>(null);
    const [replyText, setReplyText] = useState('');
    const [isSending, setIsSending] = useState(false);

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

    const handleSendReply = async (messageId: string) => {
        if (!replyText.trim()) return;

        setIsSending(true);
        try {
            const response = await api.post('/api/messages/reply', {
                messageId,
                text: replyText
            });

            if (response.success) {
                toast.success('Reply sent successfully');
                setReplyText('');
                setReplyToId(null);
                refetch();
            } else {
                toast.error(response.error.message || 'Failed to send reply');
            }
        } catch (err) {
            toast.error('Network error. Please try again.');
        } finally {
            setIsSending(false);
        }
    };

    const filteredMessages = messages?.filter(msg => 
        activeFilter === 'all' || msg.channelType === activeFilter
    );

    return (
        <Card className="border-border/40 bg-background/50 backdrop-blur-md">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5 text-primary" />
                    Unified Message History
                </CardTitle>
                
                <Tabs value={activeFilter} onValueChange={(v: any) => setActiveFilter(v)}>
                    <TabsList className="bg-muted/50 h-8">
                        <TabsTrigger value="all" className="text-xs h-7" data-testid="filter-all">All</TabsTrigger>
                        <TabsTrigger value="whatsapp" className="text-xs h-7" data-testid="filter-whatsapp">WhatsApp</TabsTrigger>
                        <TabsTrigger value="telegram" className="text-xs h-7" data-testid="filter-telegram">Telegram</TabsTrigger>
                    </TabsList>
                </Tabs>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {filteredMessages?.map((msg) => (
                        <div key={msg.id} className="space-y-3 group">
                            <div className="flex items-start gap-4 p-3 rounded-lg hover:bg-muted/30 transition-colors border border-transparent hover:border-border/50">
                                <div className={cn(
                                    "p-2 rounded-full",
                                    msg.channelType === 'whatsapp' ? "bg-green-500/10 text-green-600" :
                                    msg.channelType === 'telegram' ? "bg-blue-500/10 text-blue-600" :
                                    "bg-primary/10 text-primary"
                                )}>
                                    {msg.channelType === 'whatsapp' ? <Smartphone className="h-4 w-4" /> :
                                    msg.channelType === 'telegram' ? <SendIcon className="h-4 w-4" /> :
                                    <Zap className="h-4 w-4" />}
                                </div>
                                <div className="flex-1 space-y-1">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <span className="font-semibold text-sm flex items-center gap-1">
                                                <User className="h-3 w-3 text-muted-foreground" />
                                                {msg.remoteJid}
                                            </span>
                                            {msg.agentId && (
                                                <Badge variant="outline" className="text-[10px] h-4 gap-1 border-primary/20 text-primary">
                                                    <Bot className="h-2 w-2" />
                                                    {msg.agentId}
                                                </Badge>
                                            )}
                                        </div>
                                        <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                                            <Clock className="h-3 w-3" />
                                            {msg.timestamp ? formatDistanceToNow(new Date(msg.timestamp)) + ' ago' : 'Recently'}
                                        </span>
                                    </div>
                                    <p className="text-sm text-foreground/80 line-clamp-2">
                                        {msg.content}
                                    </p>
                                    
                                    {!msg.fromMe && (
                                        <Button 
                                            variant="ghost" 
                                            size="sm" 
                                            className="h-7 px-2 text-[10px] opacity-0 group-hover:opacity-100 transition-opacity"
                                            onClick={() => setReplyToId(replyingToId === msg.id ? null : msg.id)}
                                        >
                                            <Reply className="h-3 w-3 mr-1" />
                                            Reply
                                        </Button>
                                    )}
                                </div>
                                <div className="flex items-center gap-1">
                                    <Badge variant="outline" className={cn(
                                        "text-[10px] uppercase",
                                        msg.status === 'sent' ? 'border-primary/30 text-primary' : 'border-success/30 text-success'
                                    )}>
                                        {msg.status}
                                    </Badge>
                                </div>
                            </div>

                            {replyingToId === msg.id && (
                                <div className="ml-12 pl-4 border-l-2 border-primary/20 space-y-2 animate-in slide-in-from-left-2 duration-200">
                                    <div className="flex gap-2">
                                        <Input 
                                            placeholder="Type your reply..."
                                            value={replyText}
                                            onChange={(e) => setReplyText(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && handleSendReply(msg.id)}
                                            className="h-9 text-sm"
                                            disabled={isSending}
                                            autoFocus
                                        />
                                        <Button 
                                            size="sm" 
                                            className="h-9 px-3"
                                            onClick={() => handleSendReply(msg.id)}
                                            disabled={isSending || !replyText.trim()}
                                            aria-label="Send reply"
                                        >
                                            {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <SendIcon className="h-4 w-4" />}
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}

                    {filteredMessages?.length === 0 && (
                        <div className="text-center py-12 text-muted-foreground">
                            <p>No messages found in history.</p>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
