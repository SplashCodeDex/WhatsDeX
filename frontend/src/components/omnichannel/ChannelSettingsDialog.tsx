'use client';

import { 
    Settings2, 
    Power, 
    Trash2, 
    AlertTriangle,
    Loader2,
    ShieldAlert,
    UserCircle2
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
    Dialog, 
    DialogContent, 
    DialogDescription, 
    DialogHeader, 
    DialogTitle,
    DialogFooter
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { 
    Select, 
    SelectContent, 
    SelectItem, 
    SelectTrigger, 
    SelectValue 
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import { useOmnichannelStore } from '@/stores/useOmnichannelStore';

interface ChannelSettingsDialogProps {
    channel: any;
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
}

export function ChannelSettingsDialog({ channel, isOpen, onOpenChange }: ChannelSettingsDialogProps) {
    const [isActionLoading, setIsActionLoading] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [shouldArchive, setShouldArchive] = useState(true);
    const { disconnectChannel, deleteChannel, moveChannel, agentsResult, fetchAgents } = useOmnichannelStore();

    const agentId = channel.assignedAgentId || 'system_default';
    const [selectedTargetAgent, setSelectedTargetAgent] = useState(agentId);

    useEffect(() => {
        if (isOpen) fetchAgents();
    }, [isOpen, fetchAgents]);

    useEffect(() => {
        setSelectedTargetAgent(agentId);
    }, [agentId, isOpen]);

    const agents = agentsResult?.agents || [];

    const handleDisconnect = async () => {
        setIsActionLoading(true);
        try {
            const success = await disconnectChannel(agentId, channel.id);
            if (success) {
                toast.success(`Successfully disconnected ${channel.name}`);
                onOpenChange(false);
            } else {
                toast.error('Failed to disconnect channel');
            }
        } finally {
            setIsActionLoading(false);
        }
    };

    const handleDelete = async () => {
        setIsActionLoading(true);
        try {
            const success = await deleteChannel(agentId, channel.id, shouldArchive);
            if (success) {
                toast.success(`Successfully ${shouldArchive ? 'archived' : 'deleted'} ${channel.name}`);
                onOpenChange(false);
            } else {
                toast.error(`Failed to ${shouldArchive ? 'archive' : 'delete'} channel`);
            }
        } finally {
            setIsActionLoading(false);
        }
    };

    const handleMove = async () => {
        if (selectedTargetAgent === agentId) return;
        setIsActionLoading(true);
        try {
            const success = await moveChannel(channel.id, agentId, selectedTargetAgent);
            if (success) {
                toast.success(`Channel reassigned successfully`);
                onOpenChange(false);
            } else {
                toast.error('Failed to move channel');
            }
        } finally {
            setIsActionLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[450px] border-border/50 bg-card/95 backdrop-blur-xl">
                <DialogHeader>
                    <div className="flex items-center space-x-2 mb-2">
                        <div className="p-2 rounded-lg bg-primary/10 text-primary">
                            <Settings2 className="h-5 w-5" />
                        </div>
                        <DialogTitle className="text-xl">{channel.name}</DialogTitle>
                    </div>
                    <DialogDescription>
                        Manage connection settings and lifecycle for this channel.
                    </DialogDescription>
                </DialogHeader>

                <div className="py-6 space-y-6">
                    {/* Agent Assignment */}
                    <div className="space-y-3">
                        <Label className="text-xs uppercase tracking-wider text-muted-foreground font-bold flex items-center gap-2">
                            <UserCircle2 className="h-3 w-3" />
                            Assigned Agent
                        </Label>
                        <div className="flex gap-2">
                            <Select value={selectedTargetAgent} onValueChange={setSelectedTargetAgent}>
                                <SelectTrigger className="bg-muted/30 border-border/50 flex-1">
                                    <SelectValue placeholder="Select Agent" />
                                </SelectTrigger>
                                <SelectContent>
                                    {agents.length === 0 ? (
                                        <SelectItem value="system_default">System Default Agent</SelectItem>
                                    ) : (
                                        agents.map((agent: any) => (
                                            <SelectItem key={agent.id} value={agent.id}>
                                                {agent.name}
                                            </SelectItem>
                                        ))
                                    )}
                                </SelectContent>
                            </Select>
                            <Button 
                                variant="outline" 
                                size="sm" 
                                className="px-3"
                                disabled={isActionLoading || selectedTargetAgent === agentId}
                                onClick={handleMove}
                            >
                                {isActionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Move'}
                            </Button>
                        </div>
                        <p className="text-[10px] text-muted-foreground italic">
                            Moving a channel re-routes all incoming messages to the target agent's logic.
                        </p>
                    </div>

                    {/* Status Overview */}
                    <div className="flex items-center justify-between p-4 rounded-xl bg-muted/30 border border-border/50">
                        <div className="space-y-1">
                            <p className="text-sm font-medium text-muted-foreground">Current Status</p>
                            <div className="flex items-center gap-2">
                                <div className={cn(
                                    "h-2 w-2 rounded-full",
                                    channel.status === 'connected' ? "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]" : "bg-muted-foreground"
                                )} />
                                <span className="font-bold capitalize">{channel.status}</span>
                            </div>
                        </div>
                        <Badge variant="outline" className="bg-background/50">
                            {channel.type.toUpperCase()}
                        </Badge>
                    </div>

                    {!showDeleteConfirm ? (
                        <div className="space-y-3">
                            <div className="group">
                                <Button 
                                    variant="outline" 
                                    className="w-full justify-between h-12 border-orange-500/20 hover:bg-orange-500/10 hover:text-orange-600 hover:border-orange-500/50 group-hover:shadow-md transition-all"
                                    onClick={handleDisconnect}
                                    disabled={isActionLoading || channel.status === 'disconnected' || channel.status === 'archived'}
                                >
                                    <div className="flex items-center gap-3">
                                        <Power className="h-4 w-4" />
                                        <div className="text-left">
                                            <p className="font-bold text-sm">Disconnect Bot</p>
                                            <p className="text-[10px] text-muted-foreground">Shut down the live connection</p>
                                        </div>
                                    </div>
                                    {isActionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                                </Button>
                            </div>

                            <div className="group">
                                <Button 
                                    variant="outline" 
                                    className="w-full justify-between h-12 border-destructive/20 hover:bg-destructive/10 hover:text-destructive hover:border-destructive/50 group-hover:shadow-md transition-all"
                                    onClick={() => setShowDeleteConfirm(true)}
                                    disabled={isActionLoading}
                                >
                                    <div className="flex items-center gap-3">
                                        <Trash2 className="h-4 w-4" />
                                        <div className="text-left">
                                            <p className="font-bold text-sm text-destructive">Delete / Archive</p>
                                            <p className="text-[10px] text-muted-foreground">Remove slot or preserve history</p>
                                        </div>
                                    </div>
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <div className="p-4 rounded-xl bg-destructive/5 border border-destructive/20 space-y-4 animate-in fade-in zoom-in-95 duration-200">
                            <div className="flex items-start gap-3">
                                <div className="p-2 rounded-lg bg-destructive/10 text-destructive mt-1">
                                    <ShieldAlert className="h-5 w-5" />
                                </div>
                                <div className="space-y-1">
                                    <p className="font-bold text-destructive">Are you absolutely sure?</p>
                                    <p className="text-xs text-muted-foreground">
                                        This will remove the live connection for this channel.
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center justify-between p-3 rounded-lg bg-background/50 border border-border/50">
                                <div className="space-y-0.5">
                                    <Label className="text-sm font-bold">Archive History</Label>
                                    <p className="text-[10px] text-muted-foreground">Preserve message logs and metadata</p>
                                </div>
                                <Switch 
                                    checked={shouldArchive} 
                                    onCheckedChange={setShouldArchive}
                                    disabled={isActionLoading}
                                />
                            </div>

                            <div className="flex gap-2">
                                <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    className="flex-1" 
                                    onClick={() => setShowDeleteConfirm(false)}
                                    disabled={isActionLoading}
                                >
                                    Cancel
                                </Button>
                                <Button 
                                    variant="destructive" 
                                    size="sm" 
                                    className="flex-1 font-bold" 
                                    onClick={handleDelete}
                                    disabled={isActionLoading}
                                >
                                    {isActionLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Trash2 className="h-4 w-4 mr-2" />}
                                    Confirm {shouldArchive ? 'Archive' : 'Delete'}
                                </Button>
                            </div>
                        </div>
                    )}
                </div>

                <DialogFooter className="sm:justify-start">
                    <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3" />
                        Changes take effect immediately on the live gateway.
                    </p>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
