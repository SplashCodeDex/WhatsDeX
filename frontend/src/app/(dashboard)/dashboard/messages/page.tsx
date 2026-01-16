'use client';

import React from 'react';
import { CampaignList, CreateCampaignDialog } from '@/features/messages/index.js';
import { Send, Info } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert.js';

export default function MessagesPage() {
    return (
        <div className="flex flex-col h-full bg-black">
            {/* Header */}
            <div className="flex items-center justify-between p-8 border-b border-zinc-900 bg-zinc-950/50">
                <div>
                    <h1 className="text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
                        <Send className="w-8 h-8 text-blue-500" /> Campaign Manager
                    </h1>
                    <p className="text-zinc-400 mt-1">
                        Build, manage, and scale your WhatsApp broadcast campaigns.
                    </p>
                </div>
                <CreateCampaignDialog />
            </div>

            <div className="flex-1 overflow-auto p-8">
                <div className="max-w-7xl mx-auto space-y-8">
                    {/* Info Banner */}
                    <Alert className="bg-blue-500/10 border-blue-500/50 text-blue-200">
                        <Info className="h-4 w-4 text-blue-400" />
                        <AlertTitle>Mastermind Tip</AlertTitle>
                        <AlertDescription>
                            Broadcast campaigns are sent with random delays (5-15s) to stay beneath WhatsApp's spam detection radar.
                            Ensure your sending bot is online before starting.
                        </AlertDescription>
                    </Alert>

                    {/* Campaign List Sections */}
                    <section>
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-semibold text-zinc-100">Active & Recent Campaigns</h2>
                        </div>
                        <CampaignList />
                    </section>
                </div>
            </div>
        </div>
    );
}
