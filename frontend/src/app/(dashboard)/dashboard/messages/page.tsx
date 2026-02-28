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
                        Manage your omnichannel marketing campaigns and unified inbox.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <Button 
                        onClick={() => setShowWizard(true)}
                        className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-glow font-bold"
                    >
                        <Plus className="w-4 h-4 mr-2" /> Create Campaign
                    </Button>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 overflow-hidden p-8">
                {showWizard ? (
                    <div className="max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold">New Campaign</h2>
                            <Button variant="ghost" size="sm" onClick={() => setShowWizard(false)}>
                                <X className="w-4 h-4 mr-2" /> Cancel
                            </Button>
                        </div>
                        <CampaignWizard />
                    </div>
                ) : (
                    <Tabs defaultValue="campaigns" className="h-full flex flex-col">
                        <div className="flex items-center justify-between mb-6">
                            <TabsList className="bg-card/50 backdrop-blur-sm border border-border/40">
                                <TabsTrigger value="campaigns" className="font-bold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                                    <Send className="w-4 h-4 mr-2" /> Campaigns
                                </TabsTrigger>
                                <TabsTrigger value="inbox" className="font-bold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                                    <Inbox className="w-4 h-4 mr-2" /> Unified Inbox
                                </TabsTrigger>
                            </TabsList>

                            <div className="flex items-center gap-2">
                                <Button variant="outline" size="sm" className="h-9 border-border/40 bg-card/30">
                                    <ListFilter className="w-4 h-4 mr-2" /> Filter
                                </Button>
                            </div>
                        </div>

                        <TabsContent value="campaigns" className="flex-1 mt-0 overflow-auto pr-2">
                            <div className="grid gap-6">
                                <Alert className="bg-blue-500/10 border-blue-500/20 text-blue-600 dark:text-blue-400">
                                    <Info className="h-4 w-4" />
                                    <AlertTitle className="font-bold">Campaign Optimization</AlertTitle>
                                    <AlertDescription>
                                        Use AI Message Spinning to ensure high deliverability and prevent carrier bans.
                                    </AlertDescription>
                                </Alert>
                                <CampaignList />
                            </div>
                        </TabsContent>

                        <TabsContent value="inbox" className="flex-1 mt-0 h-full overflow-hidden">
                            <UnifiedInbox />
                        </TabsContent>
                    </Tabs>
                )}
            </div>
        </div>
    );
}
