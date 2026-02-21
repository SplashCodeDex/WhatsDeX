'use client';

import React, { useState, useMemo } from 'react';
import { User, Phone, Mail, Tag, Trash2, MoreVertical, Search, Filter, ChevronLeft, ChevronRight, Eye, Download, CheckSquare, Square } from 'lucide-react';
import { useContacts, useDeleteContact } from '../hooks/useContacts';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Contact } from '../types';
import { toast } from 'sonner';
import { ContactDetailModal } from './ContactDetailModal';

const ITEMS_PER_PAGE = 10;

export function ContactsTable() {
    const { data: contacts, isLoading, error } = useContacts();
    const deleteMutation = useDeleteContact();
    
    // State management
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedTags, setSelectedTags] = useState<string[]>([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedContacts, setSelectedContacts] = useState<Set<string>>(new Set());
    const [viewingContact, setViewingContact] = useState<Contact | null>(null);

    // Get all unique tags
    const allTags = useMemo(() => {
        if (!contacts) return [];
        const tagSet = new Set<string>();
        contacts.forEach(contact => contact.tags.forEach(tag => tagSet.add(tag)));
        return Array.from(tagSet).sort();
    }, [contacts]);

    // Filter and paginate contacts
    const filteredContacts = useMemo(() => {
        if (!contacts) return [];
        
        return contacts.filter(contact => {
            // Search filter
            const searchLower = searchQuery.toLowerCase();
            const matchesSearch = !searchQuery || 
                contact.name.toLowerCase().includes(searchLower) ||
                contact.phone.includes(searchQuery) ||
                contact.email?.toLowerCase().includes(searchLower);
            
            // Tag filter
            const matchesTags = selectedTags.length === 0 || 
                selectedTags.some(tag => contact.tags.includes(tag));
            
            return matchesSearch && matchesTags;
        });
    }, [contacts, searchQuery, selectedTags]);

    const totalPages = Math.ceil(filteredContacts.length / ITEMS_PER_PAGE);
    const paginatedContacts = filteredContacts.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE
    );

    // Handlers
    const toggleTag = (tag: string) => {
        setSelectedTags(prev => 
            prev.includes(tag) 
                ? prev.filter(t => t !== tag)
                : [...prev, tag]
        );
        setCurrentPage(1); // Reset to first page when filter changes
    };

    const toggleSelectAll = () => {
        if (selectedContacts.size === paginatedContacts.length) {
            setSelectedContacts(new Set());
        } else {
            setSelectedContacts(new Set(paginatedContacts.map(c => c.id)));
        }
    };

    const toggleSelectContact = (id: string) => {
        setSelectedContacts(prev => {
            const newSet = new Set(prev);
            if (newSet.has(id)) {
                newSet.delete(id);
            } else {
                newSet.add(id);
            }
            return newSet;
        });
    };

    const handleBulkDelete = async () => {
        if (selectedContacts.size === 0) return;
        
        const confirmed = window.confirm(`Delete ${selectedContacts.size} selected contact(s)?`);
        if (!confirmed) return;

        try {
            for (const id of selectedContacts) {
                await deleteMutation.mutateAsync(id);
            }
            toast.success(`Deleted ${selectedContacts.size} contact(s)`);
            setSelectedContacts(new Set());
        } catch (error) {
            toast.error('Failed to delete some contacts');
        }
    };

    const handleExportCSV = () => {
        const dataToExport = selectedContacts.size > 0 
            ? filteredContacts.filter(c => selectedContacts.has(c.id))
            : filteredContacts;

        const csvHeaders = ['Name', 'Phone', 'Email', 'Tags'];
        const csvRows = dataToExport.map(contact => [
            contact.name,
            contact.phone,
            contact.email || '',
            contact.tags.join('; ')
        ]);

        const csvContent = [
            csvHeaders.join(','),
            ...csvRows.map(row => row.map(cell => `"${cell}"`).join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `contacts_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);
        
        toast.success(`Exported ${dataToExport.length} contact(s)`);
    };

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
                        value={searchQuery}
                        onChange={(e) => {
                            setSearchQuery(e.target.value);
                            setCurrentPage(1);
                        }}
                    />
                </div>
                <div className="flex gap-2">
                    {selectedContacts.size > 0 && (
                        <>
                            <Button 
                                variant="outline" 
                                className="h-11 px-4 gap-2 font-bold border-border/50 rounded-xl"
                                onClick={handleExportCSV}
                            >
                                <Download className="w-4 h-4" /> Export ({selectedContacts.size})
                            </Button>
                            <Button 
                                variant="destructive" 
                                className="h-11 px-4 gap-2 font-bold rounded-xl"
                                onClick={handleBulkDelete}
                            >
                                <Trash2 className="w-4 h-4" /> Delete ({selectedContacts.size})
                            </Button>
                        </>
                    )}
                    {selectedContacts.size === 0 && (
                        <>
                            <Button 
                                variant="outline" 
                                className="h-11 px-4 gap-2 font-bold border-border/50 rounded-xl"
                                onClick={handleExportCSV}
                            >
                                <Download className="w-4 h-4" /> Export All
                            </Button>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline" className="h-11 px-4 gap-2 font-bold border-border/50 rounded-xl text-primary border-primary/20 bg-primary/5">
                                        <Tag className="w-4 h-4" /> Tags {selectedTags.length > 0 && `(${selectedTags.length})`}
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-56">
                                    {allTags.length === 0 ? (
                                        <div className="px-2 py-6 text-center text-sm text-muted-foreground">
                                            No tags available
                                        </div>
                                    ) : (
                                        <>
                                            {selectedTags.length > 0 && (
                                                <>
                                                    <DropdownMenuItem onClick={() => {
                                                        setSelectedTags([]);
                                                        setCurrentPage(1);
                                                    }}>
                                                        Clear all filters
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                </>
                                            )}
                                            {allTags.map(tag => (
                                                <DropdownMenuItem 
                                                    key={tag}
                                                    onClick={() => toggleTag(tag)}
                                                    className="flex items-center gap-2"
                                                >
                                                    {selectedTags.includes(tag) ? (
                                                        <CheckSquare className="h-4 w-4 text-primary" />
                                                    ) : (
                                                        <Square className="h-4 w-4" />
                                                    )}
                                                    {tag}
                                                </DropdownMenuItem>
                                            ))}
                                        </>
                                    )}
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </>
                    )}
                </div>
            </div>

            {/* Table */}
            <div className="rounded-2xl border border-border/40 overflow-hidden bg-background/50 backdrop-blur-sm shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-border/40 bg-muted/30">
                                <th className="px-4 py-4 w-12">
                                    <button
                                        onClick={toggleSelectAll}
                                        className="flex items-center justify-center w-5 h-5 rounded border-2 border-border hover:border-primary transition-colors"
                                    >
                                        {selectedContacts.size === paginatedContacts.length && paginatedContacts.length > 0 && (
                                            <CheckSquare className="w-4 h-4 text-primary" />
                                        )}
                                    </button>
                                </th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase text-muted-foreground tracking-widest w-[30%]">Contact</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase text-muted-foreground tracking-widest w-[25%]">Connection</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase text-muted-foreground tracking-widest w-[30%]">Tags</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase text-muted-foreground tracking-widest text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/20">
                            {paginatedContacts?.map((contact) => (
                                <tr key={contact.id} className="group hover:bg-primary/[0.02] transition-colors">
                                    <td className="px-4 py-4">
                                        <button
                                            onClick={() => toggleSelectContact(contact.id)}
                                            className="flex items-center justify-center w-5 h-5 rounded border-2 border-border hover:border-primary transition-colors"
                                        >
                                            {selectedContacts.has(contact.id) && (
                                                <CheckSquare className="w-4 h-4 text-primary" />
                                            )}
                                        </button>
                                    </td>
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
                                                <DropdownMenuItem 
                                                    className="gap-2 focus:bg-primary/10 focus:text-primary rounded-lg transition-colors cursor-pointer"
                                                    onClick={() => setViewingContact(contact)}
                                                >
                                                    <Eye className="w-4 h-4" /> View Details
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    className="gap-2 focus:bg-destructive/10 focus:text-destructive rounded-lg transition-colors cursor-pointer text-destructive/80"
                                                    onClick={() => {
                                                        if (window.confirm(`Delete contact ${contact.name}?`)) {
                                                            deleteMutation.mutate(contact.id);
                                                        }
                                                    }}
                                                >
                                                    <Trash2 className="w-4 h-4" /> Delete Contact
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </td>
                                </tr>
                            ))}
                            {paginatedContacts.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="px-6 py-20 text-center">
                                        <div className="flex flex-col items-center gap-2">
                                            <div className="p-4 rounded-full bg-muted/50 text-muted-foreground/50">
                                                <User className="w-8 h-8" />
                                            </div>
                                            <div className="font-bold text-muted-foreground">
                                                {searchQuery || selectedTags.length > 0 
                                                    ? 'No contacts match your filters'
                                                    : 'No contacts found'}
                                            </div>
                                            <p className="text-xs text-muted-foreground">
                                                {searchQuery || selectedTags.length > 0
                                                    ? 'Try adjusting your search or filters.'
                                                    : 'Try importing contacts to get started.'}
                                            </p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
                {filteredContacts.length > 0 && (
                    <div className="px-6 py-3 border-t border-border/20 bg-muted/10 flex items-center justify-between text-[10px] font-black uppercase text-muted-foreground tracking-widest">
                        <span>Showing {paginatedContacts.length} of {filteredContacts.length} Results</span>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                className="h-7 w-7 p-0"
                            >
                                <ChevronLeft className="h-4 w-4" />
                            </Button>
                            <span className="text-xs">
                                Page {currentPage} of {totalPages}
                            </span>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages}
                                className="h-7 w-7 p-0"
                            >
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                )}
            </div>

            {/* Contact Detail Modal */}
            <ContactDetailModal
                contact={viewingContact}
                isOpen={viewingContact !== null}
                onClose={() => setViewingContact(null)}
            />
        </div>
    );
}
