'use client';

import React, { useEffect, useMemo, useState } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useUsers } from '@/hooks/useUsers';
import { User } from '@/types';



export default function UsersPage(): React.ReactElement {
  const emptyForm = { name: '', email: '', phone: '' };
  const { users, loading, error, fetchUsers, createUser, updateUser, deleteUser } = useUsers();

  const [form, setForm] = useState(emptyForm);
  const [showAdd, setShowAdd] = useState(false);
  const [creating, setCreating] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchUsers({ page: '1', limit: '50', sortBy: 'createdAt', sortOrder: 'desc' });
  }, [fetchUsers]);

  const startCreate = () => {
    setForm(emptyForm);
    setShowAdd(true);
  };

  const submitCreate = async () => {
    if (!form.email && !form.phone) {
      // Logic handled in hook or needs error state? Hook handles toast.
      // We can keep local validation
      return;
    }
    await createUser({ name: form.name, email: form.email || undefined, phone: form.phone || undefined });
    setShowAdd(false);
    setForm(emptyForm);
  };

  const startEdit = (u: User): void => {
    setEditingId(u.id);
    setEditForm({ name: u.name || '', email: u.email || '', phone: u.phone || '' });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm(emptyForm);
  };

  const submitEdit = async () => {
    if (!editingId) return;
    await updateUser(editingId, { name: editForm.name, email: editForm.email || undefined, phone: editForm.phone || undefined });
    cancelEdit();
  };

  const startDelete = (id: string): void => {
    setDeletingId(id);
  };

  const confirmDelete = async () => {
    if (!deletingId) return;
    await deleteUser(deletingId);
    setDeletingId(null);
  };

  return (
    <MainLayout title="Users">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Team members</h2>
          <Button onClick={startCreate}>Add user</Button>
        </div>

        {showAdd && (
          <Card className="border-white/10 bg-white/5 dark:bg-slate-900/40 backdrop-blur-xl shadow-glass">
            <CardHeader>
              <CardTitle>Create User</CardTitle>
              <CardDescription>Provide a name and at least one contact (email or phone)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <input className="rounded-md px-3 py-2 bg-transparent border border-white/10" placeholder="Name" value={form.name} onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))} />
                <input className="rounded-md px-3 py-2 bg-transparent border border-white/10" placeholder="Email" value={form.email} onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))} />
                <input className="rounded-md px-3 py-2 bg-transparent border border-white/10" placeholder="Phone" value={form.phone} onChange={(e) => setForm(f => ({ ...f, phone: e.target.value }))} />
              </div>
              <div className="flex gap-3">
                <Button disabled={creating} onClick={submitCreate}>{creating ? 'Creating...' : 'Create'}</Button>
                <Button variant="outline" onClick={() => setShowAdd(false)}>Cancel</Button>
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="border-white/10 bg-white/5 dark:bg-slate-900/40 backdrop-blur-xl shadow-glass">
          <CardHeader>
            <CardTitle>Members</CardTitle>
            <CardDescription>Manage access and roles</CardDescription>
          </CardHeader>
          <CardContent className="divide-y divide-white/10">
            {loading && <div className="py-6 text-muted-foreground">Loading...</div>}
            {error && <div className="py-6 text-red-400">{error}</div>}
            {!loading && !error && users?.length === 0 && (
              <div className="py-6 text-muted-foreground">No users found.</div>
            )}
            {!loading && !error && users?.map((u) => (
              <div key={u.id} className="flex flex-col md:flex-row md:items-center justify-between py-4 gap-2">
                {editingId === u.id ? (
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-3">
                    <input className="rounded-md px-3 py-2 bg-transparent border border-white/10" value={editForm.name} onChange={(e) => setEditForm(f => ({ ...f, name: e.target.value }))} />
                    <input className="rounded-md px-3 py-2 bg-transparent border border-white/10" value={editForm.email} onChange={(e) => setEditForm(f => ({ ...f, email: e.target.value }))} />
                    <input className="rounded-md px-3 py-2 bg-transparent border border-white/10" value={editForm.phone} onChange={(e) => setEditForm(f => ({ ...f, phone: e.target.value }))} />
                  </div>
                ) : (
                  <div>
                    <div className="font-medium">{u.name || u.jid || 'Unknown'}</div>
                    <div className="text-sm text-muted-foreground">{u.email || u.phone || ''}</div>
                  </div>
                )}
                <div className="flex items-center gap-3">
                  <span className="text-xs px-2 py-1 rounded-md bg-white/10">{u.plan || 'free'}</span>
                  <span className={`text-xs px-2 py-1 rounded-md ${u.status === 'banned' ? 'bg-red-500/20' : 'bg-white/10'}`}>{u.status}</span>
                  {editingId === u.id ? (
                    <>
                      <Button variant="outline" disabled={saving} onClick={submitEdit}>{saving ? 'Saving...' : 'Save'}</Button>
                      <Button variant="ghost" onClick={cancelEdit}>Cancel</Button>
                    </>
                  ) : (
                    <>
                      <Button variant="outline" onClick={() => startEdit(u)}>Edit</Button>
                      <Button variant="destructive" onClick={() => startDelete(u.id)}>Delete</Button>
                    </>
                  )}
                </div>
              </div>
            ))}

            {deletingId && (
              <div className="py-3 flex items-center gap-3">
                <span>Are you sure you want to delete this user?</span>
                <Button variant="destructive" disabled={deleting} onClick={confirmDelete}>{deleting ? 'Deleting...' : 'Confirm'}</Button>
                <Button variant="outline" onClick={() => setDeletingId(null)}>Cancel</Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
