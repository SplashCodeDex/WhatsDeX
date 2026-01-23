'use client';

import React, { useState } from 'react';
import { CampaignList, CampaignWizard, UnifiedInbox } from '@/features/messages/index';
import { Send, Info, Plus, ListFilter, X, Inbox, MessageSquare } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function MessagesPage() {
    const [showWizard, setShowWizard] = useState(false);

    return (
        <div className="flex flex-col h-full bg-black">
            {/* Header */}
            <div className="flex items-center justify-between p-8 border-b border-zinc-900 bg-zinc-950/50">
                <div>
                    <h1 className="text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
                        <MessageSquare className="w-8 h-8 text-blue-500" /> Messaging Hub
                    </h1>
                    <p className="text-zinc-400 mt-1">
                        Configure campaigns or manage your unified conversation history.
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
                    <Tabs defaultValue="campaigns" className="w-full">
                        <TabsList className="bg-zinc-900 border-zinc-800">
                            <TabsTrigger value="campaigns" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                                <Send className="w-4 h-4 mr-2" /> Campaigns
                            </TabsTrigger>
                            <TabsTrigger value="inbox" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                                <Inbox className="w-4 h-4 mr-2" /> Unified Inbox
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="campaigns" className="mt-6 space-y-8">
                            {showWizard && (
                                <div className="animate-in fade-in zoom-in-95 duration-300">
                                    <CampaignWizard />
                                </div>
                            )}

                            {!showWizard && (
                                <Alert className="bg-blue-500/10 border-blue-500/50 text-blue-200">
                                    <Info className="h-4 w-4 text-blue-400" />
                                    <AlertTitle>Mastermind Tip</AlertTitle>
                                    <AlertDescription>
                                        Broadcast campaigns use BullMQ for background processing and randomized throttling to stay beneath WhatsApp's spam detection radar.
                                    </AlertDescription>
                                </Alert>
                            )}

                            <section>
                                <div className="flex items-center justify-between mb-6">
                                    <h2 className="text-xl font-bold text-zinc-100 flex items-center gap-2">
                                        <ListFilter className="w-5 h-5 text-blue-500" />
                                        {showWizard ? "Recent Campaigns" : "Active & Recent Campaigns"}
                                    </h2>
                                </div>
                                <CampaignList />
                            </section>
                        </TabsContent>

                        <TabsContent value="inbox" className="mt-6">
                            <UnifiedInbox />
                        </TabsContent>
                    </Tabs>
                </div>
            </div>
        </div>
    );
}
