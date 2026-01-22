'use client';

import React, { useState } from 'react';
import { CampaignList, CampaignWizard } from '@/features/messages/index';
import { Send, Info, Plus, ListFilter, X } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

export default function MessagesPage() {
    const [showWizard, setShowWizard] = useState(false);

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
                
                <Button 
                    onClick={() => setShowWizard(!showWizard)}
                    className={showWizard ? "bg-zinc-800 hover:bg-zinc-700" : ""}
                >
                    {showWizard ? (
                        <><X className="w-4 h-4 mr-2" /> Cancel Wizard</>
                    ) : (
                        <><Plus className="w-4 h-4 mr-2" /> New Campaign</>
                    )}
                </Button>
            </div>

            <div className="flex-1 overflow-auto p-8">
                <div className="max-w-7xl mx-auto space-y-8">
                    {showWizard && (
                        <div className="animate-in fade-in zoom-in-95 duration-300">
                            <CampaignWizard />
                        </div>
                    )}

                    {/* Info Banner */}
                    {!showWizard && (
                        <Alert className="bg-blue-500/10 border-blue-500/50 text-blue-200">
                            <Info className="h-4 w-4 text-blue-400" />
                            <AlertTitle>Mastermind Tip</AlertTitle>
                            <AlertDescription>
                                Broadcast campaigns use BullMQ for background processing and randomized throttling to stay beneath WhatsApp's spam detection radar.
                            </AlertDescription>
                        </Alert>
                    )}

                    {/* Campaign List Sections */}
                    <section>
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold text-zinc-100 flex items-center gap-2">
                                <ListFilter className="w-5 h-5 text-blue-500" /> 
                                {showWizard ? "Recent Campaigns" : "Active & Recent Campaigns"}
                            </h2>
                        </div>
                        <CampaignList />
                    </section>
                </div>
            </div>
        </div>
    );
}