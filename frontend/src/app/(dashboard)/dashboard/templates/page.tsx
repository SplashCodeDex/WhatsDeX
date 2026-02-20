'use client';

import React from 'react';
import { TemplateManagement } from '@/features/messages';
import { Layout, Info } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function TemplatesPage() {
    return (
        <div className="flex flex-col h-full bg-transparent">
            {/* Header */}
            <div className="flex items-center justify-between p-8 border-b border-border/40 bg-card/30 backdrop-blur-md">
                <div>
                    <h1 className="text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-3">
                        <Layout className="w-8 h-8 text-primary" /> Template Management
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Create and manage reusable message templates for your campaigns and auto-replies.
                    </p>
                </div>
            </div>

            <div className="flex-1 overflow-auto p-8">
                <div className="max-w-7xl mx-auto space-y-8">
                    <Alert className="bg-primary/5 border-primary/20 text-foreground">
                        <Info className="h-4 w-4 text-primary" />
                        <AlertTitle className="font-bold text-primary">Templates Tip</AlertTitle>
                        <AlertDescription className="text-muted-foreground">
                            Use variables like <code className="text-primary-600 font-bold bg-primary/10 px-1 rounded">{`{{name}}`}</code> or <code className="text-primary-600 font-bold bg-primary/10 px-1 rounded">{`{{phone}}`}</code> to dynamically inject contact details into your messages.
                        </AlertDescription>
                    </Alert>

                    <TemplateManagement />
                </div>
            </div>
        </div>
    );
}
