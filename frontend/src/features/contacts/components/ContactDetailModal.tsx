'use client';

import React, { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Contact } from '../types';
import { User, Phone, Mail, Tag, Calendar, MessageSquare, Edit2, Save, X as XIcon, Plus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';
import { useUpdateContact } from '../hooks/useContacts';

interface ContactDetailModalProps {
    contact: Contact | null;
    isOpen: boolean;
    onClose: () => void;
}

export function ContactDetailModal({ contact, isOpen, onClose }: ContactDetailModalProps) {
    const [isEditingCustomFields, setIsEditingCustomFields] = useState(false);
    const [customFields, setCustomFields] = useState<Record<string, any>>({});
    const [newFieldKey, setNewFieldKey] = useState('');
    const [newFieldValue, setNewFieldValue] = useState('');
    
    const updateMutation = useUpdateContact();

    React.useEffect(() => {
        if (contact?.attributes) {
            setCustomFields(contact.attributes);
        }
    }, [contact]);

    if (!contact) return null;

    const handleWhatsApp = () => {
        const url = `https://wa.me/${contact.phone.replace(/\+/g, '')}`;
        window.open(url, '_blank');
    };

    const handleCall = () => {
        window.location.href = `tel:${contact.phone}`;
    };

    const handleEmail = () => {
        if (contact.email) {
            window.location.href = `mailto:${contact.email}`;
        }
    };

    const handleAddCustomField = () => {
        if (!newFieldKey.trim() || !newFieldValue.trim()) {
            toast.error('Please enter both field name and value');
            return;
        }

        setCustomFields(prev => ({
            ...prev,
            [newFieldKey]: newFieldValue
        }));
        setNewFieldKey('');
        setNewFieldValue('');
    };

    const handleRemoveCustomField = (key: string) => {
        setCustomFields(prev => {
            const updated = { ...prev };
            delete updated[key];
            return updated;
        });
    };

    const handleSaveCustomFields = async () => {
        try {
            await updateMutation.mutateAsync({
                id: contact.id,
                attributes: customFields,
            });
            toast.success('Custom fields updated successfully');
            setIsEditingCustomFields(false);
        } catch (error) {
            toast.error('Failed to update custom fields');
        }
    };

    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map(n => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold">
                            {getInitials(contact.name)}
                        </div>
                        <div>
                            <div className="text-xl">{contact.name}</div>
                            <DialogDescription>{contact.phone}</DialogDescription>
                        </div>
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    {/* Quick Actions */}
                    <div className="flex gap-2">
                        <Button onClick={handleCall} variant="outline" size="sm" className="flex-1">
                            <Phone className="mr-2 h-4 w-4" />
                            Call
                        </Button>
                        {contact.email && (
                            <Button onClick={handleEmail} variant="outline" size="sm" className="flex-1">
                                <Mail className="mr-2 h-4 w-4" />
                                Email
                            </Button>
                        )}
                        <Button onClick={handleWhatsApp} variant="outline" size="sm" className="flex-1">
                            <MessageSquare className="mr-2 h-4 w-4" />
                            WhatsApp
                        </Button>
                    </div>

                    <Separator />

                    {/* Contact Info */}
                    <div className="space-y-3">
                        <h3 className="font-semibold flex items-center gap-2">
                            <User className="h-4 w-4" />
                            Contact Information
                        </h3>
                        <div className="grid gap-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Phone:</span>
                                <span className="font-medium">{contact.phone}</span>
                            </div>
                            {contact.email && (
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Email:</span>
                                    <span className="font-medium">{contact.email}</span>
                                </div>
                            )}
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Created:</span>
                                <span className="font-medium">
                                    {formatDistanceToNow(new Date(contact.createdAt), { addSuffix: true })}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Tags */}
                    {contact.tags && contact.tags.length > 0 && (
                        <>
                            <Separator />
                            <div className="space-y-3">
                                <h3 className="font-semibold flex items-center gap-2">
                                    <Tag className="h-4 w-4" />
                                    Tags
                                </h3>
                                <div className="flex flex-wrap gap-2">
                                    {contact.tags.map((tag) => (
                                        <Badge key={tag} variant="secondary">
                                            {tag}
                                        </Badge>
                                    ))}
                                </div>
                            </div>
                        </>
                    )}

                    {/* Custom Fields */}
                    <Separator />
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <h3 className="font-semibold flex items-center gap-2">
                                <Calendar className="h-4 w-4" />
                                Custom Fields
                            </h3>
                            {!isEditingCustomFields ? (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setIsEditingCustomFields(true)}
                                >
                                    <Edit2 className="h-4 w-4 mr-1" />
                                    Edit
                                </Button>
                            ) : (
                                <div className="flex gap-2">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => {
                                            setIsEditingCustomFields(false);
                                            setCustomFields(contact.attributes || {});
                                        }}
                                    >
                                        <XIcon className="h-4 w-4 mr-1" />
                                        Cancel
                                    </Button>
                                    <Button
                                        variant="default"
                                        size="sm"
                                        onClick={handleSaveCustomFields}
                                        disabled={updateMutation.isPending}
                                    >
                                        <Save className="h-4 w-4 mr-1" />
                                        Save
                                    </Button>
                                </div>
                            )}
                        </div>

                        {Object.keys(customFields).length === 0 && !isEditingCustomFields ? (
                            <p className="text-sm text-muted-foreground">No custom fields added yet</p>
                        ) : (
                            <div className="space-y-2">
                                {Object.entries(customFields).map(([key, value]) => (
                                    <div key={key} className="flex justify-between items-center text-sm border border-border rounded-lg p-2">
                                        <div className="flex-1">
                                            <span className="text-muted-foreground font-medium">{key}:</span>{' '}
                                            <span>{String(value)}</span>
                                        </div>
                                        {isEditingCustomFields && (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleRemoveCustomField(key)}
                                            >
                                                <XIcon className="h-4 w-4 text-destructive" />
                                            </Button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}

                        {isEditingCustomFields && (
                            <div className="flex gap-2">
                                <Input
                                    placeholder="Field name"
                                    value={newFieldKey}
                                    onChange={(e) => setNewFieldKey(e.target.value)}
                                    className="flex-1"
                                />
                                <Input
                                    placeholder="Field value"
                                    value={newFieldValue}
                                    onChange={(e) => setNewFieldValue(e.target.value)}
                                    className="flex-1"
                                />
                                <Button onClick={handleAddCustomField} size="sm">
                                    <Plus className="h-4 w-4" />
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
