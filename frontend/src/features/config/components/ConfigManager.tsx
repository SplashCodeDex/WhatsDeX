'use client';

import { useState, useEffect } from 'react';
import {
    Settings,
    Save,
    Shield,
    Bell,
    Cpu,
    Globe,
    Users,
    Layers,
    Lock,
    RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';

import { api, API_ENDPOINTS } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { TenantSettings } from '../types';

export function ConfigManager() {
    const [settings, setSettings] = useState<TenantSettings | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        setIsLoading(true);
        try {
            const response = await api.get<TenantSettings>(API_ENDPOINTS.SETTINGS.GET_TENANT);
            if (response.success) {
                setSettings(response.data);
            }
        } catch (error) {
            toast.error('Failed to load settings');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSave = async () => {
        if (!settings) return;

        setIsSaving(true);
        try {
            const response = await api.post(API_ENDPOINTS.SETTINGS.UPDATE_TENANT, settings);
            if (response.success) {
                toast.success('Settings updated successfully');
            }
        } catch (error) {
            toast.error('Failed to update settings');
        } finally {
            setIsSaving(false);
        }
    };

    const updateNestedSetting = (path: string, value: any) => {
        if (!settings) return;

        const newSettings = { ...settings };
        const keys = path.split('.');
        let current: any = newSettings;

        for (let i = 0; i < keys.length - 1; i++) {
            const key = keys[i];
            if (key) current = current[key];
        }
        
        const lastKey = keys[keys.length - 1];
        if (lastKey) current[lastKey] = value;

        setSettings(newSettings);
    };

    if (isLoading) {
        return (
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <Skeleton className="h-10 w-48" />
                    <Skeleton className="h-10 w-32" />
                </div>
                <div className="grid gap-6">
                    <Skeleton className="h-[400px] w-full" />
                </div>
            </div>
        );
    }

    if (!settings) return null;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Platform Configuration</h2>
                    <p className="text-muted-foreground">
                        Manage your tenant-wide settings, feature flags, and system limits.
                    </p>
                </div>
                <Button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="rounded-xl shadow-lg ring-1 ring-primary/20"
                >
                    {isSaving ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                    Save Changes
                </Button>
            </div>

            <Tabs defaultValue="general" className="space-y-4">
                <TabsList className="bg-muted/30 p-1 rounded-xl border border-border/50">
                    <TabsTrigger value="general" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">
                        <Globe className="h-4 w-4 mr-2" />
                        General
                    </TabsTrigger>
                    <TabsTrigger value="features" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">
                        <Cpu className="h-4 w-4 mr-2" />
                        AI & Features
                    </TabsTrigger>
                    <TabsTrigger value="limits" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">
                        <Layers className="h-4 w-4 mr-2" />
                        Limits & Usage
                    </TabsTrigger>
                    <TabsTrigger value="security" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">
                        <Shield className="h-4 w-4 mr-2" />
                        Safety
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="general" className="space-y-4">
                    <Card className="border-border/50 bg-card/50">
                        <CardHeader>
                            <CardTitle className="text-sm font-medium">Business Profile</CardTitle>
                            <CardDescription>Basic information about your organization.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid gap-2">
                                <Label htmlFor="name">Organization Name</Label>
                                <Input
                                    id="name"
                                    value={settings.name}
                                    onChange={(e) => setSettings({ ...settings, name: e.target.value })}
                                    className="bg-background/50"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="owner">Owner Name</Label>
                                    <Input
                                        id="owner"
                                        value={settings.ownerName || ''}
                                        onChange={(e) => setSettings({ ...settings, ownerName: e.target.value })}
                                        className="bg-background/50"
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="timezone">Timezone</Label>
                                    <Input
                                        id="timezone"
                                        value={settings.timezone || 'UTC'}
                                        onChange={(e) => setSettings({ ...settings, timezone: e.target.value })}
                                        className="bg-background/50"
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-border/50 bg-card/50">
                        <CardHeader>
                            <CardTitle className="text-sm font-medium">Notifications</CardTitle>
                            <CardDescription>Configure where you receive system alerts.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid gap-2">
                                <Label htmlFor="email">Alert Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    value={settings.notifications.alertEmail || ''}
                                    onChange={(e) => updateNestedSetting('notifications.alertEmail', e.target.value)}
                                    className="bg-background/50"
                                    placeholder="alerts@yourdomain.com"
                                />
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="features" className="space-y-4">
                    <Card className="border-border/50 bg-card/50">
                        <CardHeader>
                            <CardTitle className="text-sm font-medium">Core Intelligence</CardTitle>
                            <CardDescription>Enable or disable advanced system capabilities.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label className="text-base">AI Intent Detection</Label>
                                    <p className="text-sm text-muted-foreground">
                                        Use LLMs to classify incoming messages and extract intent.
                                    </p>
                                </div>
                                <Switch
                                    checked={settings.features.aiEnabled}
                                    onCheckedChange={(val) => updateNestedSetting('features.aiEnabled', val)}
                                />
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label className="text-base">Marketing Campaigns</Label>
                                    <p className="text-sm text-muted-foreground">
                                        Enable mass messaging and campaign scheduling tools.
                                    </p>
                                </div>
                                <Switch
                                    checked={settings.features.campaignsEnabled}
                                    onCheckedChange={(val) => updateNestedSetting('features.campaignsEnabled', val)}
                                />
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label className="text-base">Omnichannel Bridge</Label>
                                    <p className="text-sm text-muted-foreground">
                                        Allow cross-platform message routing and synchronization.
                                    </p>
                                </div>
                                <Switch
                                    checked={settings.features.omnichannelEnabled}
                                    onCheckedChange={(val) => updateNestedSetting('features.omnichannelEnabled', val)}
                                />
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="limits" className="space-y-4">
                    <Card className="border-border/50 bg-card/50">
                        <CardHeader>
                            <CardTitle className="text-sm font-medium">Resources & Quotas</CardTitle>
                            <CardDescription>Hardware and account level restrictions.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label className="flex items-center">
                                        <Layers className="h-3 w-3 mr-2 text-primary" />
                                        Max Active Channels
                                    </Label>
                                    <div className="flex items-center space-x-3">
                                        <Input
                                            type="number"
                                            value={settings.limits.maxChannels}
                                            readOnly={true}
                                            className="bg-muted/50 cursor-not-allowed w-24 text-center font-bold"
                                        />
                                        <span className="text-xs text-muted-foreground">Fixed by your current plan tier</span>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label className="flex items-center">
                                        <Users className="h-3 w-3 mr-2 text-primary" />
                                        Max Team Members
                                    </Label>
                                    <div className="flex items-center space-x-3">
                                        <Input
                                            type="number"
                                            value={settings.limits.maxUsers}
                                            readOnly={true}
                                            className="bg-muted/50 cursor-not-allowed w-24 text-center font-bold"
                                        />
                                        <span className="text-xs text-muted-foreground">Scales with enterprise license</span>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-4 p-4 rounded-xl bg-primary/5 border border-primary/10">
                                <div className="flex items-start space-x-3">
                                    <Lock className="h-4 w-4 text-primary mt-1" />
                                    <div>
                                        <p className="text-sm font-semibold">Quota Management</p>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            Resource limits are automatically provisioned based on your subscription.
                                            Contact support to increase your capacity.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
