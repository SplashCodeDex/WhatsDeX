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
import { Switch } from '@/components/ui/switch';
import { tenantApi } from '@/lib/api/tenant';
import { TenantSettings } from '@/types/tenantConfig';

// Schema matches backend validation but allows for UI-specific needs
const settingsFormSchema = z.object({
    ownerName: z.string().min(2, 'Name must be at least 2 characters').optional(),
    ownerNumber: z.string().optional(), // Can add regex for phone number if needed
    maxBots: z.coerce.number().min(1, 'Must have at least 1 bot').max(50),
    features: z.object({
        aiEnabled: z.boolean(),
        campaignsEnabled: z.boolean(),
    }),
    notifications: z.object({
        webhookUrl: z.string().url('Invalid URL').optional().or(z.literal('')),
        alertEmail: z.string().email('Invalid email').optional().or(z.literal('')),
    }).optional(),
});

type SettingsFormValues = z.infer<typeof settingsFormSchema>;

export default function TenantSettingsPage() {
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    const form = useForm<SettingsFormValues>({
        resolver: zodResolver(settingsFormSchema) as unknown as Resolver<SettingsFormValues>,
        defaultValues: {
            ownerName: '',
            ownerNumber: '',
            maxBots: 3,
            features: {
                aiEnabled: true,
                campaignsEnabled: true,
            },
            notifications: {
                webhookUrl: '',
                alertEmail: '',
            },
        },
    });

    useEffect(() => {
        async function fetchSettings() {
            try {
                const data = await tenantApi.getSettings();
                form.reset({
                    ownerName: data.ownerName || '',
                    ownerNumber: data.ownerNumber || '',
                    maxBots: data.maxBots || 3,
                    features: {
                        aiEnabled: data.features?.aiEnabled ?? true,
                        campaignsEnabled: data.features?.campaignsEnabled ?? true,
                    },
                    notifications: {
                        webhookUrl: data.notifications?.webhookUrl || '',
                        alertEmail: data.notifications?.alertEmail || '',
                    },
                });
            } catch (error) {
                toast.error('Failed to load settings', {
                    description: error instanceof Error ? error.message : 'Unknown error',
                });
            } finally {
                setIsLoading(false);
            }
        }

        fetchSettings();
    }, [form]);

    async function onSubmit(data: SettingsFormValues) {
        setIsSaving(true);
        try {
            // Sanitize data for strict optional compatibility
            const payload = {
                ownerName: data.ownerName ?? '',
                ownerNumber: data.ownerNumber ?? '',
                maxBots: data.maxBots,
                features: {
                    aiEnabled: data.features?.aiEnabled ?? false,
                    campaignsEnabled: data.features?.campaignsEnabled ?? false,
                },
                notifications: {
                    webhookUrl: data.notifications?.webhookUrl ?? '',
                    alertEmail: data.notifications?.alertEmail ?? '',
                },
            };
            await tenantApi.updateSettings(payload);
            toast.success('Settings updated successfully');
        } catch (error) {
            toast.error('Failed to update settings', {
                description: error instanceof Error ? error.message : 'Unknown error',
            });
        } finally {
            setIsSaving(false);
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
                <h3 className="text-lg font-medium">Tenant Settings</h3>
                <p className="text-sm text-muted-foreground">
                    Manage your organization profile and global configurations.
                </p>
            </div>

            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
                        <Card>
                            <CardHeader>
                                <CardTitle>General Information</CardTitle>
                                <CardDescription>
                                    Basic details about your tenant account.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <FormField
                                    control={form.control}
                                    name="ownerName"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Organization / Owner Name</FormLabel>
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
                                            <FormLabel>Owner Phone Number</FormLabel>
                                            <FormControl>
                                                <Input placeholder="1234567890" {...field} value={field.value ?? ''} />
                                            </FormControl>
                                            <FormDescription>
                                                Main contact number for system alerts.
                                            </FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="maxBots"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Max Bots</FormLabel>
                                            <FormControl>
                                                <Input type="number" {...field} value={field.value ?? ''} />
                                            </FormControl>
                                            <FormDescription>
                                                Maximum number of active WhatsApp sessions.
                                            </FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </CardContent>
                        </Card>

                        <div className="space-y-4">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Feature Toggles</CardTitle>
                                    <CardDescription>
                                        Enable or disable specific platform capabilities.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <FormField
                                        control={form.control}
                                        name="features.aiEnabled"
                                        render={({ field }) => (
                                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                                <div className="space-y-0.5">
                                                    <FormLabel className="text-base">AI Features</FormLabel>
                                                    <FormDescription>
                                                        Enable Gemini AI processing for messages.
                                                    </FormDescription>
                                                </div>
                                                <FormControl>
                                                    <Switch
                                                        checked={field.value}
                                                        onCheckedChange={field.onChange}
                                                    />
                                                </FormControl>
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="features.campaignsEnabled"
                                        render={({ field }) => (
                                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                                <div className="space-y-0.5">
                                                    <FormLabel className="text-base">Campaigns</FormLabel>
                                                    <FormDescription>
                                                        Enable bulk messaging and marketing campaigns.
                                                    </FormDescription>
                                                </div>
                                                <FormControl>
                                                    <Switch
                                                        checked={field.value}
                                                        onCheckedChange={field.onChange}
                                                    />
                                                </FormControl>
                                            </FormItem>
                                        )}
                                    />
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle>Notifications</CardTitle>
                                    <CardDescription>
                                        Configure external alerts and webhooks.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <FormField
                                        control={form.control}
                                        name="notifications.alertEmail"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Alert Email</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="admin@example.com" {...field} value={field.value ?? ''} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="notifications.webhookUrl"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Webhook URL</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="https://api.yoursite.com/webhook" {...field} value={field.value ?? ''} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </CardContent>
                            </Card>
                        </div>
                    </div>

                    <div className="flex justify-end">
                        <Button type="submit" disabled={isSaving}>
                            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {isSaving ? 'Saving...' : 'Save Changes'}
                            {!isSaving && <Save className="ml-2 h-4 w-4" />}
                        </Button>
                    </div>
                </form>
            </Form>
        </div>
    );
}
