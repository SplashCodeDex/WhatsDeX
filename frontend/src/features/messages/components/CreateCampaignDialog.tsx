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
import { Plus, Send, AlertCircle } from 'lucide-react';

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
                <Button className="bg-blue-600 hover:bg-blue-500 text-white gap-2 shadow-lg shadow-blue-900/20">
                    <Plus className="w-4 h-4" /> Create Campaign
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px] bg-zinc-950 border-zinc-800 text-zinc-100">
                <DialogHeader>
                    <DialogTitle className="text-xl font-bold flex items-center gap-2">
                        <Send className="w-5 h-5 text-blue-500" /> New Broadcast Campaign
                    </DialogTitle>
                    <DialogDescription className="text-zinc-400">
                        Send a message to multiple recipients. We use smart delays to keep your account safe.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6 pt-4">
                    <div className="space-y-2">
                        <Label htmlFor="botId" className="text-zinc-300">Sending Bot</Label>
                        <Select
                            value={formData.botId}
                            onValueChange={(val: string) => setFormData(prev => ({ ...prev, botId: val }))}
                            required
                        >
                            <SelectTrigger className="bg-zinc-900 border-zinc-800 text-zinc-200">
                                <SelectValue placeholder="Select a bot to send from" />
                            </SelectTrigger>
                            <SelectContent className="bg-zinc-900 border-zinc-800 text-zinc-200">
                                {bots?.filter((b: any) => b.status === 'online').map((bot: any) => (
                                    <SelectItem key={bot.id} value={bot.id}>{bot.name} ({bot.phoneNumber})</SelectItem>
                                ))}
                                {bots?.filter((b: any) => b.status === 'online').length === 0 && (
                                    <div className="p-2 text-xs text-zinc-500 flex items-center gap-1">
                                        <AlertCircle className="w-3 h-3" /> No online bots found
                                    </div>
                                )}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="name" className="text-zinc-300">Campaign Name</Label>
                        <Input
                            id="name"
                            placeholder="e.g. Winter Sale 2026"
                            className="bg-zinc-900 border-zinc-800 text-zinc-200"
                            value={formData.name}
                            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="message" className="text-zinc-300">Message Content</Label>
                        <Textarea
                            id="message"
                            placeholder="Type your broadcast message here..."
                            className="bg-zinc-900 border-zinc-800 text-zinc-100 min-h-[120px]"
                            value={formData.message}
                            onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="targets" className="text-zinc-300">Recipients (Selective)</Label>
                        <Textarea
                            id="targets"
                            placeholder="JIDs separated by comma, e.g. 123456789@s.whatsapp.net"
                            className="bg-zinc-900 border-zinc-800 text-zinc-400 text-xs font-mono"
                            value={formData.targets}
                            onChange={(e) => setFormData(prev => ({ ...prev, targets: e.target.value }))}
                            required
                        />
                        <p className="text-[10px] text-zinc-500 italic">
                            * Group broadcast and contact list import coming soon.
                        </p>
                    </div>

                    <DialogFooter className="pt-4 gap-2">
                        <Button type="button" variant="ghost" onClick={() => setOpen(false)} className="text-zinc-400">
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            className="bg-blue-600 hover:bg-blue-500 text-white min-w-[120px]"
                            disabled={createMutation.isPending || !formData.botId}
                        >
                            {createMutation.isPending ? 'Creating...' : 'Create Campaign'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
