'use client';

import { useEffect, useState } from 'react';
import { useForm, Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, Save } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import { Label } from '@/components/ui/label';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import {
    getTenantSettings,
    updateTenantSettings,
    getWebhooks,
    createWebhook,
    deleteWebhook
} from '@/server/dal/tenants';
import { TenantSettings, Webhook, WebhookEventSchema } from '@/types/contracts';
import { Trash2, Plus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

// Schema matches backend validation but allows for UI-specific needs
const settingsFormSchema = z.object({
    ownerName: z.string().min(2, 'Name must be at least 2 characters').optional(),
    ownerNumber: z.string().optional(),
    organization: z.string().optional(),
    maxChannels: z.coerce.number().min(1, 'Must have at least 1 channel').max(50),
    channelDefaults: z.object({
        prefix: z.array(z.string()).default(['.', '!', '/']),
        mode: z.enum(['public', 'private', 'group-only']).default('public'),
        autoReconnect: z.boolean().default(true),
        cooldownMs: z.coerce.number().min(0).default(10000),
    }),
    features: z.object({
        aiEnabled: z.boolean(),
        campaignsEnabled: z.boolean(),
        analyticsEnabled: z.boolean(),
        webhooksEnabled: z.boolean(),
    }),
    notifications: z.object({
        webhookUrl: z.string().url('Invalid URL').optional().or(z.literal('')),
        email: z.boolean(),
        notifyOnChannelDisconnect: z.boolean(),
        notifyOnErrors: z.boolean(),
    }),
});

type SettingsFormValues = z.infer<typeof settingsFormSchema>;

export default function SettingsPage() {
    const [webhooks, setWebhooks] = useState<Webhook[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isWebhookDialogOpen, setIsWebhookDialogOpen] = useState(false);
    const [newWebhookUrl, setNewWebhookUrl] = useState('');
    const [newWebhookName, setNewWebhookName] = useState('');
    const [selectedEvents, setSelectedEvents] = useState<string[]>(['message.received']);

    const form = useForm<SettingsFormValues>({
        resolver: zodResolver(settingsFormSchema) as unknown as Resolver<SettingsFormValues>,
        defaultValues: {
            ownerName: '',
            ownerNumber: '',
            organization: '',
            maxChannels: 1,
            channelDefaults: {
                prefix: ['.', '!', '/'],
                mode: 'public',
                autoReconnect: true,
                cooldownMs: 10000,
            },
            features: {
                aiEnabled: false,
                campaignsEnabled: false,
                analyticsEnabled: true,
                webhooksEnabled: false,
            },
            notifications: {
                webhookUrl: '',
                email: true,
                notifyOnChannelDisconnect: true,
                notifyOnErrors: true,
            },
        },
    });

    useEffect(() => {
        async function fetchData() {
            try {
                const [data, webhooksData] = await Promise.all([
                    getTenantSettings(),
                    getWebhooks()
                ]);

                form.reset({
                    ownerName: data.ownerName || '',
                    ownerNumber: data.ownerNumber || '',
                    organization: data.organization || '',
                    maxChannels: data.features?.maxChannels || 1,
                    channelDefaults: {
                        prefix: data.channelDefaults?.prefix || ['.', '!', '/'],
                        mode: data.channelDefaults?.mode || 'public',
                        autoReconnect: data.channelDefaults?.autoReconnect ?? true,
                        cooldownMs: data.channelDefaults?.cooldownMs ?? 10000,
                    },
                    features: {
                        aiEnabled: data.features?.aiEnabled ?? false,
                        campaignsEnabled: data.features?.campaignsEnabled ?? false,
                        analyticsEnabled: data.features?.analyticsEnabled ?? true,
                        webhooksEnabled: data.features?.webhooksEnabled ?? false,
                    },
                    notifications: {
                        webhookUrl: data.notifications?.webhookUrl || '',
                        email: data.notifications?.email ?? true,
                        notifyOnChannelDisconnect: data.notifications?.notifyOnChannelDisconnect ?? true,
                        notifyOnErrors: data.notifications?.notifyOnErrors ?? true,
                    },
                });
                setWebhooks(webhooksData);
            } catch (error) {
                toast.error('Failed to load settings', {
                    description: error instanceof Error ? error.message : 'Unknown error',
                });
            } finally {
                setIsLoading(false);
            }
        }

        fetchData();
    }, [form]);

    async function onSubmit(data: SettingsFormValues) {
        setIsSaving(true);
        try {
            const payload: Partial<TenantSettings> = {
                ownerName: data.ownerName,
                ownerNumber: data.ownerNumber,
                organization: data.organization,
                channelDefaults: data.channelDefaults,
                features: {
                    ...data.features,
                    maxChannels: data.maxChannels,
                },
                notifications: data.notifications,
            };
            await updateTenantSettings(payload);
            toast.success('Settings updated successfully');
        } catch (error) {
            toast.error('Failed to update settings', {
                description: error instanceof Error ? error.message : 'Unknown error',
            });
        } finally {
            setIsSaving(false);
        }
    }

    async function handleAddWebhook() {
        if (!newWebhookUrl || !newWebhookName) {
            toast.error('URL and Name are required');
            return;
        }

        if (selectedEvents.length === 0) {
            toast.error('At least one event must be selected');
            return;
        }

        try {
            const newWebhook = await createWebhook({
                url: newWebhookUrl,
                name: newWebhookName,
                events: selectedEvents as any[],
                secret: Math.random().toString(36).substring(2, 18) + Math.random().toString(36).substring(2, 18),
                isActive: true,
            });
            setWebhooks([...webhooks, newWebhook]);
            setNewWebhookUrl('');
            setNewWebhookName('');
            setSelectedEvents(['message.received']);
            setIsWebhookDialogOpen(false);
            toast.success('Webhook added successfully');
        } catch (error) {
            toast.error('Failed to add webhook', {
                description: error instanceof Error ? error.message : 'Unknown error',
            });
        }
    }

    async function handleDeleteWebhook(id: string) {
        if (!confirm('Are you sure you want to delete this webhook?')) return;

        try {
            await deleteWebhook(id);
            setWebhooks(webhooks.filter(w => w.id !== id));
            toast.success('Webhook deleted');
        } catch (error) {
            toast.error('Failed to delete webhook', {
                description: error instanceof Error ? error.message : 'Unknown error',
            });
        }
    }


    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-[50vh]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-medium tracking-tight">System Settings</h3>
                <p className="text-sm text-muted-foreground">
                    Configure your organization profile, feature policies, and automation webhooks.
                </p>
            </div>

            <Separator />

            <Tabs defaultValue="general" className="w-full">
                <TabsList className="grid w-full grid-cols-3 lg:w-[400px]">
                    <TabsTrigger value="general">General</TabsTrigger>
                    <TabsTrigger value="advanced">Advanced</TabsTrigger>
                    <TabsTrigger value="webhooks">Webhooks</TabsTrigger>
                </TabsList>

                <TabsContent value="general">
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pt-4">
                            <div className="grid gap-6 md:grid-cols-2">
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="text-base font-semibold">Organization Profile</CardTitle>
                                        <CardDescription>
                                            Basic contact and identity information.
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <FormField
                                            control={form.control}
                                            name="ownerName"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Owner Name</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="John Doe" {...field} value={field.value ?? ''} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="organization"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Organization</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="Acme Corp" {...field} value={field.value ?? ''} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="ownerNumber"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Phone Number</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="+233..." {...field} value={field.value ?? ''} />
                                                    </FormControl>
                                                    <FormDescription>Used for critical alerts.</FormDescription>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader>
                                        <CardTitle className="text-base font-semibold">Notification Preferences</CardTitle>
                                        <CardDescription>
                                            Choose how you receive system alerts.
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <FormField
                                            control={form.control}
                                            name="notifications.email"
                                            render={({ field }) => (
                                                <FormItem className="flex items-center justify-between rounded-md border p-4">
                                                    <div className="space-y-0.5">
                                                        <FormLabel>Email Alerts</FormLabel>
                                                        <FormDescription>Reports and disconnect alerts.</FormDescription>
                                                    </div>
                                                    <FormControl>
                                                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                                                    </FormControl>
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="notifications.notifyOnChannelDisconnect"
                                            render={({ field }) => (
                                                <FormItem className="flex items-center justify-between rounded-md border p-4">
                                                    <div className="space-y-0.5">
                                                        <FormLabel>Disconnect Alerts</FormLabel>
                                                        <FormDescription>Notify when a channel goes offline.</FormDescription>
                                                    </div>
                                                    <FormControl>
                                                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                                                    </FormControl>
                                                </FormItem>
                                            )}
                                        />
                                    </CardContent>
                                </Card>
                            </div>

                            <div className="flex justify-end">
                                <Button type="submit" disabled={isSaving}>
                                    {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                                    {isSaving ? 'Saving...' : 'Save General Settings'}
                                </Button>
                            </div>
                        </form>
                    </Form>
                </TabsContent>

                <TabsContent value="advanced">
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pt-4">
                            <div className="grid gap-6 md:grid-cols-2">
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="text-base font-semibold">Feature Toggles</CardTitle>
                                        <CardDescription>
                                            Platform capabilities based on your plan.
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <FormField
                                            control={form.control}
                                            name="features.aiEnabled"
                                            render={({ field }) => (
                                                <FormItem className="flex items-center justify-between rounded-md border p-4">
                                                    <div className="space-y-0.5">
                                                        <FormLabel>AI Processing</FormLabel>
                                                        <FormDescription>Enable Gemini for message analysis.</FormDescription>
                                                    </div>
                                                    <FormControl>
                                                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                                                    </FormControl>
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="features.webhooksEnabled"
                                            render={({ field }) => (
                                                <FormItem className="flex items-center justify-between rounded-md border p-4">
                                                    <div className="space-y-0.5">
                                                        <FormLabel>Outbound Webhooks</FormLabel>
                                                        <FormDescription>Enable event streaming to external systems.</FormDescription>
                                                    </div>
                                                    <FormControl>
                                                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                                                    </FormControl>
                                                </FormItem>
                                            )}
                                        />
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader>
                                        <CardTitle className="text-base font-semibold">Channel Defaults</CardTitle>
                                        <CardDescription>
                                            Global defaults for new communication channels.
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <FormField
                                            control={form.control}
                                            name="maxChannels"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Max Channels</FormLabel>
                                                    <FormControl>
                                                        <Input type="number" {...field} value={field.value ?? ''} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="channelDefaults.autoReconnect"
                                            render={({ field }) => (
                                                <FormItem className="flex items-center justify-between rounded-md border p-4">
                                                    <div className="space-y-0.5">
                                                        <FormLabel>Auto Reconnect</FormLabel>
                                                        <FormDescription>Automatically retry failed connections.</FormDescription>
                                                    </div>
                                                    <FormControl>
                                                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                                                    </FormControl>
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="channelDefaults.mode"
                                            render={({ field }) => (
                                                <FormItem className="space-y-3">
                                                    <FormLabel>Operation Mode</FormLabel>
                                                    <FormControl>
                                                        <div className="flex gap-2">
                                                            {['public', 'private', 'group-only'].map((m) => (
                                                                <Button
                                                                    key={m}
                                                                    type="button"
                                                                    variant={field.value === m ? 'default' : 'outline'}
                                                                    size="sm"
                                                                    className="capitalize"
                                                                    onClick={() => field.onChange(m)}
                                                                >
                                                                    {m.replace('-', ' ')}
                                                                </Button>
                                                            ))}
                                                        </div>
                                                    </FormControl>
                                                    <FormDescription>Determines default visibility for new channels.</FormDescription>
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="channelDefaults.prefix"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Command Prefixes</FormLabel>
                                                    <FormControl>
                                                        <Input 
                                                            placeholder="., !, /" 
                                                            value={field.value.join(', ')} 
                                                            onChange={(e) => {
                                                                const val = e.target.value.split(',').map(s => s.trim()).filter(s => s !== '');
                                                                field.onChange(val);
                                                            }}
                                                        />
                                                    </FormControl>
                                                    <FormDescription>Comma-separated list of symbols (e.g. ., !, /).</FormDescription>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </CardContent>
                                </Card>
                            </div>

                            <div className="flex justify-end">
                                <Button type="submit" disabled={isSaving}>
                                    {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                                    {isSaving ? 'Saving...' : 'Save Advanced Config'}
                                </Button>
                            </div>
                        </form>
                    </Form>
                </TabsContent>

                <TabsContent value="webhooks">
                    <div className="space-y-6 pt-4">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between">
                                <div>
                                    <CardTitle className="text-base font-semibold">Active Webhooks</CardTitle>
                                    <CardDescription>
                                        Stream real-time events to your external endpoints.
                                    </CardDescription>
                                </div>
                                <Button onClick={() => setIsWebhookDialogOpen(true)} size="sm">
                                    <Plus className="mr-2 h-4 w-4" /> Add Webhook
                                </Button>
                            </CardHeader>
                            <CardContent>
                                {webhooks.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-8 text-center border-2 border-dashed rounded-lg">
                                        <p className="text-muted-foreground">No webhooks configured yet.</p>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {webhooks.map((webhook) => (
                                            <div key={webhook.id} className="flex items-center justify-between p-4 border rounded-lg">
                                                <div className="space-y-1">
                                                    <div className="flex items-center gap-2">
                                                        <p className="font-medium">{webhook.name || 'Untitled Webhook'}</p>
                                                        {!webhook.isActive && <Badge variant="secondary">Inactive</Badge>}
                                                    </div>
                                                    <p className="text-xs text-muted-foreground font-mono">{webhook.url}</p>
                                                    <div className="flex gap-1 pt-1">
                                                        {webhook.events.map(event => (
                                                            <Badge key={event} variant="outline" className="text-[10px]">
                                                                {event}
                                                            </Badge>
                                                        ))}
                                                    </div>
                                                </div>
                                                <div className="flex gap-2">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="text-destructive h-8 w-8"
                                                        onClick={() => handleDeleteWebhook(webhook.id)}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base font-semibold">Global Webhook</CardTitle>
                                <CardDescription>
                                    Legacy notification endpoint for system-wide raw data events.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Form {...form}>
                                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                                        <FormField
                                            control={form.control}
                                            name="notifications.webhookUrl"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Primary URL</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="https://..." {...field} value={field.value ?? ''} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <div className="flex justify-end pt-2">
                                            <Button type="submit" disabled={isSaving} size="sm">
                                                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                                {isSaving ? 'Saving...' : 'Update Global Webhook'}
                                            </Button>
                                        </div>
                                    </form>
                                </Form>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>
            </Tabs>

            <Dialog open={isWebhookDialogOpen} onOpenChange={setIsWebhookDialogOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Add New Webhook</DialogTitle>
                        <DialogDescription>
                            Enter the destination URL for your event stream. We'll send a test event once created.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="webhook-name">Friendly Name</Label>
                            <Input 
                                id="webhook-name"
                                placeholder="Marketing Sync" 
                                value={newWebhookName}
                                onChange={(e) => setNewWebhookName(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="webhook-url">Webhook URL</Label>
                            <Input 
                                id="webhook-url"
                                placeholder="https://your-api.com/webhook" 
                                value={newWebhookUrl}
                                onChange={(e) => setNewWebhookUrl(e.target.value)}
                            />
                        </div>
                        <div className="space-y-3 pt-2">
                            <Label>Subscribe to Events</Label>
                            <div className="grid grid-cols-2 gap-2">
                                {[
                                    { id: 'message.received', label: 'Message Recv' },
                                    { id: 'message.sent', label: 'Message Sent' },
                                    { id: 'channel.connected', label: 'Connected' },
                                    { id: 'channel.disconnected', label: 'Disconnected' },
                                    { id: 'channel.error', label: 'Channel Error' },
                                    { id: 'campaign.completed', label: 'Campaign Done' },
                                    { id: 'flow.executed', label: 'Flow Executed' }
                                ].map((event) => (
                                    <div key={event.id} className="flex items-center space-x-2">
                                        <Switch 
                                            id={`event-${event.id}`}
                                            checked={selectedEvents.includes(event.id)}
                                            onCheckedChange={(checked) => {
                                                if (checked) {
                                                    setSelectedEvents([...selectedEvents, event.id]);
                                                } else {
                                                    setSelectedEvents(selectedEvents.filter(e => e !== event.id));
                                                }
                                            }}
                                        />
                                        <label 
                                            htmlFor={`event-${event.id}`}
                                            className="text-xs font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                        >
                                            {event.label}
                                        </label>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                    <div className="flex justify-end gap-3">
                        <Button variant="outline" onClick={() => {
                            setIsWebhookDialogOpen(false);
                            setNewWebhookUrl('');
                            setNewWebhookName('');
                            setSelectedEvents(['message.received']);
                        }}>
                            Cancel
                        </Button>
                        <Button onClick={handleAddWebhook} disabled={!newWebhookUrl || !newWebhookName || selectedEvents.length === 0}>
                            Create Webhook
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
