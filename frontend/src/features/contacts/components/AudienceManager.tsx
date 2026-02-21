'use client';

import React, { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Target, Plus, Trash2, Users, Filter } from 'lucide-react';
import { useAudiences, useCreateAudience, useDeleteAudience } from '../hooks/useAudiences';
import { toast } from 'sonner';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';

interface AudienceManagerProps {
    isOpen: boolean;
    onClose: () => void;
}

export function AudienceManager({ isOpen, onClose }: AudienceManagerProps) {
    const [isCreating, setIsCreating] = useState(false);
    const [newAudienceName, setNewAudienceName] = useState('');
    const [newAudienceDescription, setNewAudienceDescription] = useState('');

    const { data: audiences, isLoading } = useAudiences();
    const createMutation = useCreateAudience();
    const deleteMutation = useDeleteAudience();

    const handleCreate = async () => {
        if (!newAudienceName.trim()) {
            toast.error('Please enter an audience name');
            return;
        }

        try {
            await createMutation.mutateAsync({
                name: newAudienceName,
                description: newAudienceDescription,
                filters: {}, // Default empty filters - user would configure this later
            });
            toast.success('Audience created successfully');
            setNewAudienceName('');
            setNewAudienceDescription('');
            setIsCreating(false);
        } catch (error) {
            toast.error('Failed to create audience');
        }
    };

    const handleDelete = async (audienceId: string) => {
        if (!confirm('Are you sure you want to delete this audience?')) {
            return;
        }

        try {
            await deleteMutation.mutateAsync(audienceId);
            toast.success('Audience deleted successfully');
        } catch (error) {
            toast.error('Failed to delete audience');
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-3xl">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Target className="h-5 w-5 text-primary" />
                        Audience Manager
                    </DialogTitle>
                    <DialogDescription>
                        Create and manage audience segments for targeted campaigns
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    {/* Create New Audience */}
                    {!isCreating ? (
                        <Button onClick={() => setIsCreating(true)} className="w-full" variant="outline">
                            <Plus className="mr-2 h-4 w-4" />
                            Create New Audience
                        </Button>
                    ) : (
                        <div className="border border-border rounded-lg p-4 space-y-3">
                            <Input
                                placeholder="Audience name (e.g., Premium Customers)"
                                value={newAudienceName}
                                onChange={(e) => setNewAudienceName(e.target.value)}
                            />
                            <Input
                                placeholder="Description (optional)"
                                value={newAudienceDescription}
                                onChange={(e) => setNewAudienceDescription(e.target.value)}
                            />
                            <div className="flex gap-2">
                                <Button 
                                    onClick={handleCreate} 
                                    disabled={createMutation.isPending}
                                    className="flex-1"
                                >
                                    Create
                                </Button>
                                <Button 
                                    onClick={() => {
                                        setIsCreating(false);
                                        setNewAudienceName('');
                                        setNewAudienceDescription('');
                                    }} 
                                    variant="outline"
                                    className="flex-1"
                                >
                                    Cancel
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* Audiences List */}
                    {isLoading ? (
                        <div className="py-8 text-center text-muted-foreground">
                            Loading audiences...
                        </div>
                    ) : audiences && audiences.length > 0 ? (
                        <div className="border border-border rounded-lg overflow-hidden">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Name</TableHead>
                                        <TableHead>Description</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {audiences.map((audience) => (
                                        <TableRow key={audience.id}>
                                            <TableCell className="font-medium">
                                                <div className="flex items-center gap-2">
                                                    <Users className="h-4 w-4 text-primary" />
                                                    {audience.name}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-muted-foreground">
                                                {audience.description || 'No description'}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleDelete(audience.id)}
                                                    disabled={deleteMutation.isPending}
                                                >
                                                    <Trash2 className="h-4 w-4 text-destructive" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    ) : (
                        <div className="py-12 text-center">
                            <Filter className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                            <p className="text-muted-foreground">No audiences created yet</p>
                            <p className="text-sm text-muted-foreground mt-1">
                                Create your first audience to segment your contacts
                            </p>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
