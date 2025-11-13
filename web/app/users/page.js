'use client';

import React from 'react';
import Layout from '@/components/common/Layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function UsersPage() {
  const users = [
    { id: 1, name: 'Alice Johnson', role: 'Admin', email: 'alice@example.com' },
    { id: 2, name: 'Bob Smith', role: 'Member', email: 'bob@example.com' },
    { id: 3, name: 'Carol Nguyen', role: 'Member', email: 'carol@example.com' },
  ];

  return (
    <Layout title="Users">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Team members</h2>
          <Button>Add user</Button>
        </div>

        <Card className="border-white/10 bg-white/5 dark:bg-slate-900/40 backdrop-blur-xl shadow-glass">
          <CardHeader>
            <CardTitle>Members</CardTitle>
            <CardDescription>Manage access and roles</CardDescription>
          </CardHeader>
          <CardContent className="divide-y divide-white/10">
            {users.map((u) => (
              <div key={u.id} className="flex flex-col md:flex-row md:items-center justify-between py-4 gap-2">
                <div>
                  <div className="font-medium">{u.name}</div>
                  <div className="text-sm text-muted-foreground">{u.email}</div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm px-2 py-1 rounded-md bg-white/10">{u.role}</span>
                  <Button variant="outline">Edit</Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
