'use client';

import React, { useState } from 'react';
import { Users, Info, Target } from 'lucide-react';
import { ContactsTable, ImportContactsDialog, ImportHistoryPanel } from '@/features/contacts';
import { AudienceManager } from '@/features/contacts/components/AudienceManager';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

export default function ContactsPage() {
    const [showAudienceManager, setShowAudienceManager] = useState(false);

    return (
        <div className="flex flex-col h-full bg-transparent">
            {/* Header */}
            <div className="flex items-center justify-between p-8 border-b border-border/50 bg-background/20 backdrop-blur-md">
                <div>
                    <h1 className="text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-3">
                        <Users className="w-8 h-8 text-primary" /> Contact Directory
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Manage your customer database and organize contacts for targeted campaigns.
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <Button
                        variant="outline"
                        onClick={() => setShowAudienceManager(true)}
                        className="gap-2"
                    >
                        <Target className="w-4 h-4" />
                        Audiences
                    </Button>
                    <ImportHistoryPanel />
                    <ImportContactsDialog />
                </div>
            </div>

            <div className="flex-1 overflow-auto p-8">
                <div className="max-w-7xl mx-auto space-y-8">
                    {/* Info Banner */}
                    <Alert className="bg-primary/10 border-primary/50 text-primary-foreground/90">
                        <Info className="h-4 w-4 text-primary" />
                        <AlertTitle className="font-bold uppercase tracking-widest text-[10px]">CRM Integration</AlertTitle>
                        <AlertDescription className="text-sm">
                            Contacts imported here can be grouped into <strong>Audiences</strong> for bulk messaging campaigns. Use tags to segment your users effectively.
                        </AlertDescription>
                    </Alert>

                    <ContactsTable />
                </div>
            </div>

            {/* Audience Manager Dialog */}
            <AudienceManager 
                isOpen={showAudienceManager}
                onClose={() => setShowAudienceManager(false)}
            />
        </div>
    );
}
