'use client';

import { useSettings } from '../hooks/useSettings';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Loader2, Save, Building2, User, Phone, Zap } from 'lucide-react';
import { useState, useEffect } from 'react';

export function WorkspaceSettings() {
    const { settings, isLoading, updateSettings, isUpdating } = useSettings();
    const [formData, setFormData] = useState<any>(null);

    useEffect(() => {
        if (settings) {
            setFormData(settings);
        }
    }, [settings]);

    if (isLoading || !formData) {
        return (
            <div className="flex items-center justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    const handleSave = () => {
        updateSettings(formData);
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Workspace Settings</h2>
                    <p className="text-muted-foreground text-sm">
                        Manage your organization profile, default bot behavior, and notifications.
                    </p>
                </div>
                <Button onClick={handleSave} disabled={isUpdating} className="gap-2">
                    {isUpdating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    Save Changes
                </Button>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                {/* Organization Details */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <Building2 className="h-5 w-5 text-primary" />
                            Organization
                        </CardTitle>
                        <CardDescription>Identity and contact information</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="organization">Organization Name</Label>
                            <Input
                                id="organization"
                                value={formData.organization || ''}
                                onChange={(e) => setFormData({ ...formData, organization: e.target.value })}
                                placeholder="Acme Corp"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="ownerName">Owner Name</Label>
                                <Input
                                    id="ownerName"
                                    value={formData.ownerName || ''}
                                    onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })}
                                    placeholder="John Doe"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="ownerNumber">Primary WhatsApp</Label>
                                <Input
                                    id="ownerNumber"
                                    value={formData.ownerNumber || ''}
                                    onChange={(e) => setFormData({ ...formData, ownerNumber: e.target.value })}
                                    disabled
                                    className="bg-muted"
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Notifications */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <Zap className="h-5 w-5 text-primary" />
                            Notifications
                        </CardTitle>
                        <CardDescription>Stay informed about your bots</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label>Email Alerts</Label>
                                <p className="text-[12px] text-muted-foreground">Receive system updates via email</p>
                            </div>
                            <Switch
                                checked={formData.notifications.email}
                                onCheckedChange={(val: boolean) => setFormData({
                                    ...formData,
                                    notifications: { ...formData.notifications, email: val }
                                })}
                            />
                        </div>
                        <Separator />
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label>Disconnect Warnings</Label>
                                <p className="text-[12px] text-muted-foreground">Notify when a bot goes offline</p>
                            </div>
                            <Switch
                                checked={formData.notifications.notifyOnBotDisconnect}
                                onCheckedChange={(val: boolean) => setFormData({
                                    ...formData,
                                    notifications: { ...formData.notifications, notifyOnBotDisconnect: val }
                                })}
                            />
                        </div>
                        <Separator />
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label>Error Logs</Label>
                                <p className="text-[12px] text-muted-foreground">Notify on critical processing errors</p>
                            </div>
                            <Switch
                                checked={formData.notifications.notifyOnErrors}
                                onCheckedChange={(val: boolean) => setFormData({
                                    ...formData,
                                    notifications: { ...formData.notifications, notifyOnErrors: val }
                                })}
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Bot Defaults */}
                <Card className="col-span-1 md:col-span-2">
                    <CardHeader>
                        <CardTitle className="text-lg">Bot Blueprint</CardTitle>
                        <CardDescription>Default configuration for new instances</CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-6 md:grid-cols-3">
                        <div className="space-y-2">
                            <Label>Default Mode</Label>
                            <select
                                className="w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                                value={formData.botDefaults.mode}
                                onChange={(e) => setFormData({
                                    ...formData,
                                    botDefaults: { ...formData.botDefaults, mode: e.target.value }
                                })}
                            >
                                <option value="public">Public (Everyone)</option>
                                <option value="private">Private (Owner Only)</option>
                                <option value="group-only">Groups Only</option>
                            </select>
                        </div>
                        <div className="space-y-2">
                            <Label>Command Prefixes</Label>
                            <Input
                                value={formData.botDefaults.prefix.join(' ')}
                                onChange={(e) => setFormData({
                                    ...formData,
                                    botDefaults: { ...formData.botDefaults, prefix: e.target.value.split(/\s+/) }
                                })}
                                placeholder=". ! /"
                            />
                            <p className="text-[10px] text-muted-foreground italic">Space separated prefixes</p>
                        </div>
                        <div className="flex items-center justify-between pt-6">
                            <div className="space-y-0.5">
                                <Label>Auto Reconnect</Label>
                                <p className="text-[10px] text-muted-foreground">Retry on session drop</p>
                            </div>
                            <Switch
                                checked={formData.botDefaults.autoReconnect}
                                onCheckedChange={(val: boolean) => setFormData({
                                    ...formData,
                                    botDefaults: { ...formData.botDefaults, autoReconnect: val }
                                })}
                            />
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
