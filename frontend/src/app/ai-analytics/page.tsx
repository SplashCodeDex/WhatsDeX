'use client';

import React from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export default function AIAnalyticsPage(): React.ReactElement {
  return (
    <MainLayout title="AI Analytics">
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="border-white/10 bg-white/5 dark:bg-slate-900/40 backdrop-blur-xl shadow-glass transition-transform hover:scale-[1.01]">
            <CardHeader>
              <CardTitle>Metric {i}</CardTitle>
              <CardDescription>Last 24 hours</CardDescription>
            </CardHeader>
            <CardContent className="h-24 flex items-end">
              <div className="w-full h-2 rounded-full bg-gradient-to-r from-blue-500/60 to-purple-500/60" />
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mt-6">
        <Card className="border-white/10 bg-white/5 dark:bg-slate-900/40 backdrop-blur-xl shadow-glass">
          <CardHeader>
            <CardTitle>Conversations</CardTitle>
            <CardDescription>Volume by hour</CardDescription>
          </CardHeader>
          <CardContent className="h-64 flex items-center justify-center text-muted-foreground">
            Chart placeholder
          </CardContent>
        </Card>
        <Card className="border-white/10 bg-white/5 dark:bg-slate-900/40 backdrop-blur-xl shadow-glass">
          <CardHeader>
            <CardTitle>Resolution Rate</CardTitle>
            <CardDescription>AI vs Human handoff</CardDescription>
          </CardHeader>
          <CardContent className="h-64 flex items-center justify-center text-muted-foreground">
            Chart placeholder
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
