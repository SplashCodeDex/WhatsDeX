'use client';

import React from 'react';
import Layout from '@/components/common/Layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function SettingsPage() {
  return (
    <Layout title="Settings">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 border-white/10 bg-white/5 dark:bg-slate-900/40 backdrop-blur-xl shadow-glass">
          <CardHeader>
            <CardTitle>Profile</CardTitle>
            <CardDescription>Update your profile information</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" placeholder="Jane Doe" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="jane@company.com" />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="company">Company</Label>
              <Input id="company" placeholder="WhatsDeX Inc" />
            </div>
            <div className="md:col-span-2">
              <Button className="mt-2">Save changes</Button>
            </div>
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-white/5 dark:bg-slate-900/40 backdrop-blur-xl shadow-glass">
          <CardHeader>
            <CardTitle>Theme</CardTitle>
            <CardDescription>Personalize your experience</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Toggle theme from the top bar. Your preference is saved.</p>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-3 border-white/10 bg-white/5 dark:bg-slate-900/40 backdrop-blur-xl shadow-glass">
          <CardHeader>
            <CardTitle>Security</CardTitle>
            <CardDescription>Manage passwords and sessions</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="password">New Password</Label>
              <Input id="password" type="password" placeholder="••••••••" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm">Confirm Password</Label>
              <Input id="confirm" type="password" placeholder="••••••••" />
            </div>
            <div className="md:col-span-2">
              <Button className="mt-2">Update password</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
