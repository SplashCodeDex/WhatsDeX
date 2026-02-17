'use client';

import { useState } from 'react';
import { useOmnichannelStore } from '@/stores/useOmnichannelStore';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { Loader2, Plus } from 'lucide-react';
import type { CronJob, CronSchedule, CronPayload } from '@/types';

interface CreateCronJobDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function CreateCronJobDialog({ open, onOpenChange }: CreateCronJobDialogProps) {
    const { createCronJob, channels } = useOmnichannelStore();
    const [loading, setLoading] = useState(false);
    
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [scheduleKind, setScheduleKind] = useState<'every' | 'at' | 'cron'>('every');
    const [scheduleValue, setScheduleValue] = useState('60000'); // Default 1 minute in ms
    const [payloadKind, setPayloadKind] = useState<'systemEvent' | 'agentTurn'>('systemEvent');
    const [payloadText, setPayloadText] = useState('');
    const [agentId, setAgentId] = useState('default');
    const [enabled, setEnabled] = useState(true);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            let schedule: CronSchedule;
            if (scheduleKind === 'every') {
                schedule = { kind: 'every', everyMs: parseInt(scheduleValue) };
            } else if (scheduleKind === 'at') {
                schedule = { kind: 'at', at: scheduleValue };
            } else {
                schedule = { kind: 'cron', expr: scheduleValue };
            }

            const payload: CronPayload = payloadKind === 'systemEvent' 
                ? { kind: 'systemEvent', text: payloadText }
                : { kind: 'agentTurn', message: payloadText };

            const success = await createCronJob({
                name,
                description,
                agentId,
                enabled,
                schedule,
                payload,
                wakeMode: 'now',
                sessionTarget: 'main'
            });

            if (success) {
                toast.success('Cron job created successfully');
                onOpenChange(false);
                resetForm();
            } else {
                toast.error('Failed to create cron job');
            }
        } catch (err) {
            toast.error('Invalid schedule or payload data');
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setName('');
        setDescription('');
        setScheduleKind('every');
        setScheduleValue('60000');
        setPayloadKind('systemEvent');
        setPayloadText('');
        setAgentId('default');
        setEnabled(true);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Create New Cron Job</DialogTitle>
                    <DialogDescription>
                        Schedule a recurring task or a one-time wakeup for your bots.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Job Name</Label>
                            <Input 
                                id="name" 
                                placeholder="Morning Health Check" 
                                value={name} 
                                onChange={(e) => setName(e.target.value)} 
                                required 
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="agentId">Agent ID</Label>
                            <Input 
                                id="agentId" 
                                placeholder="default" 
                                value={agentId} 
                                onChange={(e) => setAgentId(e.target.value)} 
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description">Description (Optional)</Label>
                        <Input 
                            id="description" 
                            placeholder="Runs every morning to verify connectivity" 
                            value={description} 
                            onChange={(e) => setDescription(e.target.value)} 
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4 border-t pt-4">
                        <div className="space-y-2">
                            <Label>Schedule Type</Label>
                            <Select value={scheduleKind} onValueChange={(v: any) => setScheduleKind(v)}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="every">Interval (ms)</SelectItem>
                                    <SelectItem value="at">Specific Time</SelectItem>
                                    <SelectItem value="cron">Cron Expression</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="scheduleValue">
                                {scheduleKind === 'every' ? 'Milliseconds' : scheduleKind === 'at' ? 'ISO Timestamp' : 'Expression'}
                            </Label>
                            <Input 
                                id="scheduleValue" 
                                placeholder={scheduleKind === 'cron' ? '*/5 * * * *' : '60000'} 
                                value={scheduleValue} 
                                onChange={(e) => setScheduleValue(e.target.value)} 
                                required 
                            />
                        </div>
                    </div>

                    <div className="space-y-2 border-t pt-4">
                        <Label>Payload Type</Label>
                        <Select value={payloadKind} onValueChange={(v: any) => setPayloadKind(v)}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="systemEvent">System Event</SelectItem>
                                <SelectItem value="agentTurn">Agent Turn (Message)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="payloadText">
                            {payloadKind === 'systemEvent' ? 'Event Text' : 'Message Content'}
                        </Label>
                        <Input 
                            id="payloadText" 
                            placeholder={payloadKind === 'systemEvent' ? 'ping' : 'Hello agent, start your daily tasks.'} 
                            value={payloadText} 
                            onChange={(e) => setPayloadText(e.target.value)} 
                            required 
                        />
                    </div>

                    <div className="flex items-center justify-between border-t pt-4">
                        <div className="space-y-0.5">
                            <Label>Enable Immediately</Label>
                            <p className="text-xs text-muted-foreground">
                                Job will start as soon as it's created.
                            </p>
                        </div>
                        <Switch checked={enabled} onCheckedChange={setEnabled} />
                    </div>

                    <DialogFooter className="pt-4">
                        <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Create Job
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
