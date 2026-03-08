'use client';

import { useState } from 'react';
import { 
    Settings2, 
    Power, 
    Trash2, 
    AlertTriangle,
    Loader2,
    ShieldAlert
} from 'lucide-react';
import { 
    Dialog, 
    DialogContent, 
    DialogDescription, 
    DialogHeader, 
    DialogTitle,
    DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useOmnichannelStore } from '@/stores/useOmnichannelStore';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface ChannelSettingsDialogProps {
    channel: any;
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
}

export function ChannelSettingsDialog({ channel, isOpen, onOpenChange }: ChannelSettingsDialogProps) {
    const [isActionLoading, setIsActionLoading] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const { disconnectChannel, deleteChannel } = useOmnichannelStore();

    const agentId = channel.assignedAgentId || 'system_default';

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
            const success = await deleteChannel(agentId, channel.id);
            if (success) {
                toast.success(`Successfully deleted ${channel.name}`);
                onOpenChange(false);
            } else {
                toast.error('Failed to delete channel');
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
                                    disabled={isActionLoading || channel.status === 'disconnected'}
                                >
                                    <div className="flex items-center gap-3">
                                        <Power className="h-4 w-4" />
                                        <div className="text-left">
                                            <p className="font-bold text-sm">Disconnect Bot</p>
                                            <p className="text-[10px] text-muted-foreground">Shut down the live connection</p>
                                        </div>
                                    </div>
                                    {isActionLoading && <Loader2 className="h-4 w-4 animate-spin" />}
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
                                            <p className="font-bold text-sm text-destructive">Delete Channel</p>
                                            <p className="text-[10px] text-muted-foreground">Permanently remove this slot</p>
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
                                        This will permanently delete the channel and all associated connection data. This action cannot be undone.
                                    </p>
                                </div>
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
                                    Confirm Delete
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
