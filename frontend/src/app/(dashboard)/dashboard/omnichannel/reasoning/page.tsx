import React from 'react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { OpenClawChatFrame } from '@/features/omnichannel/components/OpenClawChatFrame';

export default function ReasoningPage(): React.JSX.Element {
  return (
    <div className="flex flex-col space-y-6 p-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Mastermind Reasoning Trace</h2>
          <p className="text-muted-foreground">
            Real-time visualization of the agent's cognitive process and OpenClaw execution stream.
          </p>
        </div>
      </div>
      <Separator />
      
      <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-1">
        <Card className="h-[calc(100vh-200px)]">
          <CardHeader>
            <CardTitle>OpenClaw Live Dashboard</CardTitle>
            <CardDescription>
              Direct feed from the local OpenClaw gateway instance (Port 18789).
            </CardDescription>
          </CardHeader>
          <CardContent className="h-full p-0">
            <OpenClawChatFrame className="h-full border-0 rounded-b-xl" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
