'use client';

import React from 'react';
import { User, Phone, Mail, Tag, Trash2, MoreVertical, Search, Filter } from 'lucide-react';
import { useContacts, useDeleteContact } from '../hooks/useContacts';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export function ContactsTable() {
    const { data: contacts, isLoading, error } = useContacts();
    const deleteMutation = useDeleteContact();

    if (isLoading) {
        return (
            <div className="space-y-4">
                <div className="h-10 w-full bg-muted rounded-lg animate-pulse" />
                {[1, 2, 3, 4, 5].map(i => (
                    <div key={i} className="h-16 w-full bg-card/50 border border-border/50 rounded-xl animate-pulse" />
                ))}
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-12 text-center rounded-2xl border border-border/50 bg-destructive/5">
                <p className="text-destructive font-bold">Failed to load contacts</p>
                <p className="text-xs text-muted-foreground mt-1">{error instanceof Error ? error.message : 'Unknown error'}</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Filters Bar */}
            <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                        placeholder="Search contacts by name or phone..."
                        className="pl-10 h-11 bg-background/50 border-border/50 focus:border-primary/50 transition-all rounded-xl"
                    />
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" className="h-11 px-4 gap-2 font-bold border-border/50 rounded-xl">
                        <Filter className="w-4 h-4" /> Filters
                    </Button>
                    <Button variant="outline" className="h-11 px-4 gap-2 font-bold border-border/50 rounded-xl text-primary border-primary/20 bg-primary/5">
                        <Tag className="w-4 h-4" /> Tags
                    </Button>
                </div>
            </div>

            {/* Table */}
            <div className="rounded-2xl border border-border/40 overflow-hidden bg-background/50 backdrop-blur-sm shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-border/40 bg-muted/30">
                                <th className="px-6 py-4 text-[10px] font-black uppercase text-muted-foreground tracking-widest w-[30%]">Contact</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase text-muted-foreground tracking-widest w-[25%]">Connection</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase text-muted-foreground tracking-widest w-[30%]">Tags</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase text-muted-foreground tracking-widest text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/20">
                            {contacts?.map((contact) => (
                                <tr key={contact.id} className="group hover:bg-primary/[0.02] transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold shadow-sm">
                                                {contact.name?.[0]?.toUpperCase() || '?'}
                                            </div>
                                            <div>
                                                <div className="font-bold text-sm tracking-tight">{contact.name}</div>
                                                {contact.email && (
                                                    <div className="text-[10px] text-muted-foreground flex items-center gap-1">
                                                        <Mail className="w-3 h-3" /> {contact.email}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col gap-1">
                                            <div className="text-xs font-mono font-bold flex items-center gap-1.5">
                                                <Phone className="w-3 h-3 text-primary" />
                                                {contact.phone}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-wrap gap-1.5">
                                            {contact.tags.map((tag) => (
                                                <Badge
                                                    key={tag}
                                                    variant="secondary"
                                                    className="bg-muted hover:bg-muted text-[10px] font-black rounded-md border-border/50 uppercase tracking-tighter"
                                                >
                                                    {tag}
                                                </Badge>
                                            ))}
                                            {contact.tags.length === 0 && (
                                                <span className="text-[10px] text-muted-foreground italic uppercase font-bold tracking-widest">No tags</span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <MoreVertical className="w-4 h-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="w-48 p-1 border-border/50 bg-background/95 backdrop-blur-xl">
                                                <DropdownMenuItem className="gap-2 focus:bg-primary/10 focus:text-primary rounded-lg transition-colors cursor-pointer">
                                                    <User className="w-4 h-4" /> View Details
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    className="gap-2 focus:bg-destructive/10 focus:text-destructive rounded-lg transition-colors cursor-pointer text-destructive/80"
                                                    onClick={() => deleteMutation.mutate(contact.id)}
                                                >
                                                    <Trash2 className="w-4 h-4" /> Delete Contact
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </td>
                                </tr>
                            ))}
                            {(!contacts || contacts.length === 0) && (
                                <tr>
                                    <td colSpan={4} className="px-6 py-20 text-center">
                                        <div className="flex flex-col items-center gap-2">
                                            <div className="p-4 rounded-full bg-muted/50 text-muted-foreground/50">
                                                <User className="w-8 h-8" />
                                            </div>
                                            <div className="font-bold text-muted-foreground">No contacts found</div>
                                            <p className="text-xs text-muted-foreground">Try importing contacts to get started.</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
                {contacts && contacts.length > 0 && (
                    <div className="px-6 py-3 border-t border-border/20 bg-muted/10 flex items-center justify-between text-[10px] font-black uppercase text-muted-foreground tracking-widest">
                        <span>Showing {contacts.length} Results</span>
                        <div className="flex items-center gap-1">
                            Page 1 of 1
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
