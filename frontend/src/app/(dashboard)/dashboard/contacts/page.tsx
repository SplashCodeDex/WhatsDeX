'use client';

import React from 'react';
import { Users, Info } from 'lucide-react';
import { ContactsTable, ImportContactsDialog } from '@/features/contacts';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function ContactsPage() {
    return (
        <div className="flex flex-col h-full bg-black">
            {/* Header */}
            <div className="flex items-center justify-between p-8 border-b border-zinc-900 bg-zinc-950/50">
                <div>
                    <h1 className="text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
                        <Users className="w-8 h-8 text-primary" /> Contact Directory
                    </h1>
                    <p className="text-zinc-400 mt-1">
                        Manage your customer database and organize contacts for targeted campaigns.
                    </p>
                </div>

                <ImportContactsDialog />
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
        </div>
    );
}
