'use client';

import React from 'react';
import Layout from '@/components/common/Layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export default function BillingPage() {
  const invoices = [
    { id: 'INV-001', date: '2024-09-01', amount: '$29.99', status: 'Paid' },
    { id: 'INV-002', date: '2024-10-01', amount: '$29.99', status: 'Paid' },
    { id: 'INV-003', date: '2024-11-01', amount: '$29.99', status: 'Due' },
  ];

  return (
    <Layout title="Billing">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 border-white/10 bg-white/5 dark:bg-slate-900/40 backdrop-blur-xl shadow-glass">
          <CardHeader>
            <CardTitle>Current Plan</CardTitle>
            <CardDescription>Manage your subscription</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <div className="text-2xl font-semibold">Basic</div>
                <div className="text-muted-foreground">$29.99 / month</div>
              </div>
              <div className="flex gap-3">
                <Button variant="outline">Change plan</Button>
                <Button>Manage payment</Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-white/5 dark:bg-slate-900/40 backdrop-blur-xl shadow-glass">
          <CardHeader>
            <CardTitle>Usage</CardTitle>
            <CardDescription>This billing period</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Messages</span>
              <span>3,240 / 5,000</span>
            </div>
            <div className="h-2 w-full rounded-full bg-white/10 overflow-hidden">
              <div className="h-full w-[64%] bg-gradient-to-r from-blue-500 to-purple-500" />
            </div>
            <div className="flex items-center justify-between text-sm">
              <span>AI Requests</span>
              <span>320 / 500</span>
            </div>
            <div className="h-2 w-full rounded-full bg-white/10 overflow-hidden">
              <div className="h-full w-[64%] bg-gradient-to-r from-emerald-500 to-teal-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-3 border-white/10 bg-white/5 dark:bg-slate-900/40 backdrop-blur-xl shadow-glass">
          <CardHeader>
            <CardTitle>Invoices</CardTitle>
            <CardDescription>Your recent invoices</CardDescription>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <table className="w-full min-w-[500px]">
              <thead>
                <tr className="text-left text-sm text-muted-foreground">
                  <th className="py-2">Invoice</th>
                  <th className="py-2">Date</th>
                  <th className="py-2">Amount</th>
                  <th className="py-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((inv) => (
                  <tr key={inv.id} className="border-t border-white/10">
                    <td className="py-3 font-medium">{inv.id}</td>
                    <td className="py-3">{inv.date}</td>
                    <td className="py-3">{inv.amount}</td>
                    <td className="py-3">
                      <Badge className={inv.status === 'Paid' ? 'bg-emerald-500' : 'bg-amber-500'}>
                        {inv.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
