'use client';

import React from 'react';
import Layout from '@/components/common/Layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export default function SystemPage() {
  const services = [
    { name: 'API', status: 'Operational' },
    { name: 'Webhooks', status: 'Operational' },
    { name: 'Queue', status: 'Degraded' },
    { name: 'Database', status: 'Operational' },
  ];

  return (
    <Layout title="System">
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {services.map((s) => (
          <Card key={s.name} className="border-white/10 bg-white/5 dark:bg-slate-900/40 backdrop-blur-xl shadow-glass">
            <CardHeader>
              <CardTitle>{s.name}</CardTitle>
              <CardDescription>Status</CardDescription>
            </CardHeader>
            <CardContent>
              <span className={`px-2 py-1 rounded-md text-sm ${s.status === 'Operational' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'}`}>
                {s.status}
              </span>
            </CardContent>
          </Card>
        ))}
      </div>
    </Layout>
  );
}
