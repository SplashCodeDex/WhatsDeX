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
        <div className="flex flex-col h-full bg-transparent transition-colors duration-300">
            {/* Header */}
            <div className="flex items-center justify-between p-8 border-b border-border/40 bg-card/30 backdrop-blur-md">
                <div>
                    <h1 className="text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-3">
                        <MessageSquare className="w-8 h-8 text-primary" /> Messaging Hub
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Configure campaigns or manage your unified conversation history.
                    </p>
                </div>

                <Button
                    onClick={() => setShowWizard(!showWizard)}
                    variant={showWizard ? "secondary" : "default"}
                    className="shadow-lg shadow-primary/10"
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
                        <TabsList className="bg-muted/50 border border-border/50">
                            <TabsTrigger value="campaigns" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                                <Send className="w-4 h-4 mr-2" /> Campaigns
                            </TabsTrigger>
                            <TabsTrigger value="inbox" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
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
                                <Alert className="bg-primary/5 border-primary/20 text-foreground">
                                    <Info className="h-4 w-4 text-primary" />
                                    <AlertTitle className="font-bold text-primary">Mastermind Tip</AlertTitle>
                                    <AlertDescription className="text-muted-foreground">
                                        Broadcast campaigns use BullMQ for background processing and randomized throttling to stay beneath WhatsApp's spam detection radar.
                                    </AlertDescription>
                                </Alert>
                            )}

                            <section>
                                <div className="flex items-center justify-between mb-6">
                                    <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                                        <ListFilter className="w-5 h-5 text-primary" />
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
