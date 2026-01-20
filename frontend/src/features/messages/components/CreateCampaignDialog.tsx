'use client';

import React, { useState } from 'react';
import { useCreateCampaign } from '../hooks/useCampaigns';
import { useBots } from '@/features/bots/hooks/useBots';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Plus, Send, AlertCircle, Users, Radio, Sparkles } from 'lucide-react';

export function CreateCampaignDialog() {
    const [open, setOpen] = useState(false);
    const { data: bots } = useBots();
    const createMutation = useCreateCampaign();

    const [formData, setFormData] = useState({
        name: '',
        message: '',
        botId: '',
        audienceType: 'selective' as 'groups' | 'contacts' | 'selective',
        targets: '' // Comma separated for selective
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const targets = formData.targets.split(',').map(t => t.trim()).filter(Boolean);

        createMutation.mutate({
            name: formData.name,
            message: formData.message,
            botId: formData.botId,
            audience: {
                type: formData.audienceType,
                targets: targets
            },
            schedule: { type: 'immediate' }
        }, {
            onSuccess: () => {
                setOpen(false);
                setFormData({
                    name: '',
                    message: '',
                    botId: '',
                    audienceType: 'selective',
                    targets: ''
                });
            }
        });
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="font-semibold shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all">
                    <Plus className="w-4 h-4 mr-2" /> New Campaign
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] border-border/40 bg-background/80 backdrop-blur-xl">
                <DialogHeader className="space-y-4 pb-4 border-b border-border/40">
                    <div className="flex items-center gap-3">
                        <div className="p-3 rounded-xl bg-primary/10 border border-primary/20">
                            <Send className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                            <DialogTitle className="text-xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                                Create Broadcast
                            </DialogTitle>
                            <DialogDescription className="text-muted-foreground mt-1">
                                Reach your audience instantly or schedule for peak engagement.
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6 pt-6">
                    <div className="grid grid-cols-2 gap-6">
                        {/* Bot Selection */}
                        <div className="space-y-2">
                            <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Sending From</Label>
                            <Select
                                value={formData.botId}
                                onValueChange={(val: string) => setFormData(prev => ({ ...prev, botId: val }))}
                                required
                            >
                                <SelectTrigger className="h-11">
                                    <SelectValue placeholder="Select Bot" />
                                </SelectTrigger>
                                <SelectContent>
                                    {bots?.filter((b: any) => b.status === 'online').map((bot: any) => (
                                        <SelectItem key={bot.id} value={bot.id} className="cursor-pointer">
                                            <div className="flex items-center gap-2">
                                                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                                                <span className="font-medium">{bot.name}</span>
                                                <span className="text-xs text-muted-foreground">({bot.phoneNumber})</span>
                                            </div>
                                        </SelectItem>
                                    ))}
                                    {(!bots || bots.filter((b: any) => b.status === 'online').length === 0) && (
                                        <div className="p-3 text-xs text-destructive flex items-center gap-2 bg-destructive/10 rounded-md m-1">
                                            <AlertCircle className="w-3 h-3" /> No online bots found
                                        </div>
                                    )}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Campaign Name */}
                        <div className="space-y-2">
                            <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Campaign Name</Label>
                            <Input
                                placeholder="e.g. Summer Promo 2026"
                                className="h-11"
                                value={formData.name}
                                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                required
                            />
                        </div>
                    </div>

                    {/* Message Content */}
                    <div className="space-y-2">
                        <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Message Content</Label>
                        <div className="relative">
                            <Textarea
                                placeholder="Type your message here... Use *bold*, _italics_ or emoji."
                                className="min-h-[140px] resize-none pr-4 font-normal leading-relaxed"
                                value={formData.message}
                                onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
                                required
                            />
                            <div className="absolute bottom-3 right-3 flex gap-2">
                                <Button size="icon" variant="ghost" className="h-6 w-6 text-muted-foreground hover:text-primary">
                                    <Sparkles className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* Audience Segment */}
                    <div className="space-y-3 p-4 rounded-xl border border-border/40 bg-muted/20">
                        <div className="flex items-center justify-between">
                            <Label className="flex items-center gap-2 text-sm font-semibold">
                                <Users className="w-4 h-4 text-primary" /> Target Audience
                            </Label>
                            <div className="flex gap-1">
                                <Badge variant={formData.audienceType === 'selective' ? 'default' : 'outline'} className="cursor-pointer" onClick={() => setFormData(prev => ({ ...prev, audienceType: 'selective' }))}>
                                    Selective
                                </Badge>
                                <Badge variant="outline" className="opacity-50 cursor-not-allowed">Groups</Badge>
                                <Badge variant="outline" className="opacity-50 cursor-not-allowed">Contacts</Badge>
                            </div>
                        </div>

                        {formData.audienceType === 'selective' && (
                            <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                                <Textarea
                                    placeholder="Paste WhatsApp JIDs here (comma separated), e.g. 123456789@s.whatsapp.net"
                                    className="bg-background/50 font-mono text-xs h-20"
                                    value={formData.targets}
                                    onChange={(e) => setFormData(prev => ({ ...prev, targets: e.target.value }))}
                                    required
                                />
                                <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                                    <Radio className="w-3 h-3" /> Manual input mode. Bulk import from CSV coming soon.
                                </p>
                            </div>
                        )}
                    </div>

                    <DialogFooter className="pt-2">
                        <div className="flex-1 text-xs text-muted-foreground flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-blue-500" /> Auto-spaced delivery (5-15s delay)
                        </div>
                        <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            className="min-w-[140px]"
                            disabled={createMutation.isPending || !formData.botId}
                        >
                            {createMutation.isPending ? (
                                <span className="flex items-center gap-2">
                                    <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                                    Creating...
                                </span>
                            ) : (
                                <span className="flex items-center gap-2">
                                    <Send className="w-4 h-4" /> Launch Campaign
                                </span>
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
