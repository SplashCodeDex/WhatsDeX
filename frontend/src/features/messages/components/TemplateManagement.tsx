'use client';

import React, { useState } from 'react';
import { useTemplates, useSpinMessage } from '../hooks/useTemplates';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
    Loader2, 
    Plus, 
    MessageSquare, 
    Edit2, 
    Trash2, 
    Copy,
    Layout,
    AlertCircle,
    Search,
    Sparkles
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useAuth } from '@/features/auth';

/**
 * TemplateManagement Component
 * 
 * Provides a full UI for managing message templates (CRUD).
 */
export function TemplateManagement() {
    const { user } = useAuth();
    const { data: templates, isLoading, error } = useTemplates();
    const { mutateAsync: spinMessage, isPending: isSpinning } = useSpinMessage();
    const [searchTerm, setSearchText] = useState('');
    const [spinningId, setSpinningId] = useState<string | null>(null);

    const isEnterprise = user?.planTier === 'enterprise';

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
                <p>Failed to load templates</p>
            </div>
        );
    }

    const filteredTemplates = templates?.filter(t => 
        t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.content.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleCopy = (content: string) => {
        navigator.clipboard.writeText(content);
        toast.success('Content copied to clipboard');
    };

    const handleSpin = async (templateId: string, content: string) => {
        if (!isEnterprise) {
            toast.error('AI Message Spinning is an Enterprise-only feature');
            return;
        }

        setSpinningId(templateId);
        try {
            const result = await spinMessage(content);
            // In a real app, we might open a modal to approve the new version
            // For now, we'll just copy it to clipboard and show success
            navigator.clipboard.writeText(result);
            toast.success('AI variation generated and copied to clipboard!', {
                description: 'You can now paste this new version into your template.'
            });
        } catch (err: any) {
            toast.error(err.message || 'AI spinning failed');
        } finally {
            setSpinningId(null);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                        placeholder="Search templates..." 
                        className="pl-10 h-10"
                        value={searchTerm}
                        onChange={(e) => setSearchText(e.target.value)}
                    />
                </div>
                <Button className="shadow-lg shadow-primary/10">
                    <Plus className="w-4 h-4 mr-2" /> Create Template
                </Button>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {filteredTemplates?.map((template) => (
                    <Card key={template.id} className="group border-border/40 bg-card/30 backdrop-blur-md hover:border-primary/30 transition-all duration-300">
                        <CardHeader className="pb-3">
                            <div className="flex justify-between items-start mb-2">
                                <div className="p-2 rounded-lg bg-primary/10 text-primary">
                                    <MessageSquare className="h-4 w-4" />
                                </div>
                                <Badge variant="outline" className="text-[10px] uppercase font-bold tracking-tighter">
                                    {template.category}
                                </Badge>
                            </div>
                            <CardTitle className="text-lg font-bold truncate group-hover:text-primary transition-colors">
                                {template.name}
                            </CardTitle>
                            <CardDescription className="text-xs uppercase font-mono tracking-widest">
                                {template.mediaType}
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="relative p-4 rounded-xl bg-muted/30 border border-border/20 text-sm line-clamp-4 min-h-[100px]">
                                {template.content}
                                <div className="absolute bottom-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Button 
                                        variant="secondary" 
                                        size="icon" 
                                        className="h-7 w-7"
                                        onClick={() => handleSpin(template.id, template.content)}
                                        disabled={spinningId === template.id}
                                    >
                                        {spinningId === template.id ? (
                                            <Loader2 className="h-3 w-3 animate-spin" />
                                        ) : (
                                            <Sparkles className="h-3 w-3 text-primary" />
                                        )}
                                    </Button>
                                    <Button 
                                        variant="ghost" 
                                        size="icon" 
                                        className="h-7 w-7"
                                        onClick={() => handleCopy(template.content)}
                                    >
                                        <Copy className="h-3 w-3" />
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter className="flex justify-between border-t border-border/10 pt-4 bg-muted/5">
                            <div className="flex gap-1">
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary">
                                    <Edit2 className="h-3.5 w-3.5" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive">
                                    <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                            </div>
                            <span className="text-[10px] text-muted-foreground font-medium">
                                Updated {new Date(template.updatedAt).toLocaleDateString()}
                            </span>
                        </CardFooter>
                    </Card>
                ))}

                {filteredTemplates?.length === 0 && (
                    <div className="col-span-full py-20 text-center space-y-4">
                        <Layout className="h-12 w-12 text-muted-foreground/20 mx-auto" />
                        <div>
                            <p className="text-lg font-bold text-foreground/60">No templates found</p>
                            <p className="text-sm text-muted-foreground">Try a different search or create a new template.</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

