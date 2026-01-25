'use client';

import { useState, useEffect, useActionState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from '@/components/ui/select';
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage
} from '@/components/ui/form';
import { Badge } from '@/components/ui/badge';
import { Loader2, Save, Sparkles, Shield, Zap, Settings2, Terminal, Search, Filter } from 'lucide-react';
import { BotConfig } from '../types';
import { updateBot } from '../actions';
import { updateBotSchema, UpdateBotInput } from '../schemas';
import { toast } from 'sonner';

interface BotSettingsDialogProps {
    botId: string;
    initialConfig: Partial<BotConfig> | undefined;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function BotSettingsDialog({ botId, initialConfig, open, onOpenChange }: BotSettingsDialogProps) {
    const [isPending, startTransition] = useTransition();
    const [state, setState] = useState<{ success?: boolean; error?: any } | null>(null);

    const form = useForm<UpdateBotInput>({
        resolver: zodResolver(updateBotSchema),
        defaultValues: {
            config: {
                ...initialConfig,
                prefix: initialConfig?.prefix || ['.', '!', '/'],
            }
        }
    });

    // Reset form when initialConfig changes or dialog opens
    useEffect(() => {
        if (open && initialConfig) {
            form.reset({
                config: {
                    ...initialConfig,
                    prefix: initialConfig?.prefix || ['.', '!', '/'],
                }
            });
            setState(null);
        }
    }, [open, initialConfig, form]);

    const onSave = (data: UpdateBotInput) => {
        // Handle exactOptionalPropertyTypes by removing undefined values
        const filteredConfig = data.config
            ? Object.fromEntries(
                Object.entries(data.config).filter(([_, v]) => v !== undefined)
            )
            : undefined;

        const filteredData: UpdateBotInput = {
            ...data,
            config: filteredConfig as unknown as UpdateBotInput['config'],
        };

        startTransition(async () => {
            const formData = new FormData();
            formData.append('data', JSON.stringify(filteredData));
            
            const result = await updateBot(botId, null, formData);
            setState(result);
            
            if (result.success) {
                toast.success('Configuration updated successfully');
                onOpenChange(false);
            } else {
                toast.error(result.error.message || 'Failed to update configuration');
            }
        });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <div className="flex items-center gap-2">
                        <Settings2 className="w-5 h-5 text-primary" />
                        <DialogTitle>Bot Configuration</DialogTitle>
                    </div>
                    <DialogDescription>
                        Fine-tune your bot's behavior, AI personality, and automated responses.
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form 
                        onSubmit={form.handleSubmit(onSave)} 
                        className="space-y-6"
                        aria-label="bot-settings-form"
                    >
                        <Tabs defaultValue="behavior" className="w-full">
                            <TabsList className="grid w-full grid-cols-4">
                                <TabsTrigger value="behavior" className="gap-2">
                                    <Shield className="w-4 h-4" /> Behavior
                                </TabsTrigger>
                                <TabsTrigger value="ai" className="gap-2">
                                    <Sparkles className="w-4 h-4" /> AI
                                </TabsTrigger>
                                <TabsTrigger value="automation" className="gap-2">
                                    <Zap className="w-4 h-4" /> Automation
                                </TabsTrigger>
                                <TabsTrigger value="commands" className="gap-2">
                                    <Terminal className="w-4 h-4" /> Commands
                                </TabsTrigger>
                                <TabsTrigger value="advanced" className="gap-2">
                                    Advanced
                                </TabsTrigger>
                            </TabsList>

                            {/* Behavior Tab */}
                            <TabsContent value="behavior" className="space-y-4 pt-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="config.mode"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Bot Mode</FormLabel>
                                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                    <FormControl>
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Select mode" />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        <SelectItem value="public">Public (Everyone)</SelectItem>
                                                        <SelectItem value="private">Private (DMs Only)</SelectItem>
                                                        <SelectItem value="group-only">Group Only</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                <FormDescription>Where the bot responds.</FormDescription>
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="config.prefix"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Prefixes</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        placeholder=".,!,/"
                                                        {...field}
                                                        onChange={(e) => field.onChange(e.target.value.split(',').map(s => s.trim()))}
                                                        value={field.value?.join(',') || ''}
                                                    />
                                                </FormControl>
                                                <FormDescription>Comma-separated triggers.</FormDescription>
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-x-8 gap-y-4 pt-4 border-t">
                                    <FormField
                                        control={form.control}
                                        name="config.alwaysOnline"
                                        render={({ field }) => (
                                            <FormItem className="flex items-center justify-between gap-2">
                                                <div className="space-y-0.5">
                                                    <FormLabel>Always Online</FormLabel>
                                                    <p className="text-xs text-muted-foreground">Force "available" status</p>
                                                </div>
                                                <FormControl>
                                                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                                                </FormControl>
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="config.antiCall"
                                        render={({ field }) => (
                                            <FormItem className="flex items-center justify-between gap-2">
                                                <div className="space-y-0.5">
                                                    <FormLabel>Anti-Call</FormLabel>
                                                    <p className="text-xs text-muted-foreground">Reject incoming calls</p>
                                                </div>
                                                <FormControl>
                                                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                                                </FormControl>
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="config.autoRead"
                                        render={({ field }) => (
                                            <FormItem className="flex items-center justify-between gap-2">
                                                <div className="space-y-0.5">
                                                    <FormLabel>Auto-Read</FormLabel>
                                                    <p className="text-xs text-muted-foreground">Blue ticks on messages</p>
                                                </div>
                                                <FormControl>
                                                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                                                </FormControl>
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="config.autoTypingCmd"
                                        render={({ field }) => (
                                            <FormItem className="flex items-center justify-between gap-2">
                                                <div className="space-y-0.5">
                                                    <FormLabel>Typing Effect</FormLabel>
                                                    <p className="text-xs text-muted-foreground">Show typing during commands</p>
                                                </div>
                                                <FormControl>
                                                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                                                </FormControl>
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            </TabsContent>

                            {/* AI Tab */}
                            <TabsContent value="ai" className="space-y-4 pt-4">
                                <FormField
                                    control={form.control}
                                    name="config.aiEnabled"
                                    render={({ field }) => (
                                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                            <div className="space-y-0.5">
                                                <FormLabel className="flex items-center gap-2">
                                                    Enable Gemini AI <Badge variant="secondary" className="bg-purple-100 text-purple-700">Premium</Badge>
                                                </FormLabel>
                                                <FormDescription>
                                                    Allow the bot to use AI for intelligent conversations.
                                                </FormDescription>
                                            </div>
                                            <FormControl>
                                                <Switch checked={field.value} onCheckedChange={field.onChange} />
                                            </FormControl>
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="config.aiPersonality"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>AI Personality / Prompt</FormLabel>
                                            <FormControl>
                                                <Input placeholder="You are a helpful assistant named WhatsDeX..." {...field} />
                                            </FormControl>
                                            <FormDescription>Defines how the AI responds.</FormDescription>
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="config.autoAiLabel"
                                    render={({ field }) => (
                                        <FormItem className="flex items-center justify-between gap-2">
                                            <div className="space-y-0.5">
                                                <FormLabel>AI Label</FormLabel>
                                                <p className="text-xs text-muted-foreground">Prefix AI replies with [AI]</p>
                                            </div>
                                            <FormControl>
                                                <Switch checked={field.value} onCheckedChange={field.onChange} />
                                            </FormControl>
                                        </FormItem>
                                    )}
                                />
                            </TabsContent>

                            {/* Automation Tab */}
                            <TabsContent value="automation" className="space-y-4 pt-4">
                                <FormField
                                    control={form.control}
                                    name="config.autoReply"
                                    render={({ field }) => (
                                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                            <div className="space-y-0.5">
                                                <FormLabel>Away Auto-Reply</FormLabel>
                                                <FormDescription>Send automated message when offline.</FormDescription>
                                            </div>
                                            <FormControl>
                                                <Switch checked={field.value} onCheckedChange={field.onChange} />
                                            </FormControl>
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="config.autoReplyMessage"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Auto-Reply Message</FormLabel>
                                            <FormControl>
                                                <Input {...field} />
                                            </FormControl>
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="config.welcomeMessage"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Welcome Message (DM)</FormLabel>
                                            <FormControl>
                                                <Input {...field} />
                                            </FormControl>
                                            <DialogDescription className="text-xs">Triggered on first-time contact.</DialogDescription>
                                        </FormItem>
                                    )}
                                />
                            </TabsContent>

                            {/* Commands Tab (Command Store) */}
                            <TabsContent value="commands" className="space-y-4 pt-4">
                                <div className="flex items-center gap-2 mb-4">
                                    <div className="relative flex-1">
                                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            placeholder="Search commands..."
                                            className="pl-9"
                                            onChange={(e) => {
                                                // Local filter logic could go here
                                            }}
                                        />
                                    </div>
                                    <Button variant="outline" size="icon">
                                        <Filter className="h-4 w-4" />
                                    </Button>
                                </div>

                                <div className="rounded-lg border bg-card">
                                    <div className="p-4 border-b bg-muted/30">
                                        <h4 className="text-sm font-semibold">Global Command Store</h4>
                                        <p className="text-xs text-muted-foreground">Selectively enable or disable commands for this bot instance.</p>
                                    </div>

                                    <div className="max-h-[400px] overflow-y-auto p-4 space-y-6">
                                        {/* Since we don't have the full command list from API yet,
                                            we'll use a curated list of most common ones for now */}
                                        {['Main', 'Sticker', 'AI', 'Downloader', 'Tool'].map((cat) => (
                                            <div key={cat} className="space-y-3">
                                                <h5 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{cat}</h5>
                                                <div className="grid grid-cols-1 gap-2">
                                                    {getMockCommands(cat).map((cmd: { name: string; desc: string }) => (
                                                        <FormField
                                                            key={cmd.name}
                                                            control={form.control}
                                                            name="config.disabledCommands"
                                                            render={({ field }) => (
                                                                <FormItem className="flex items-center justify-between p-2 rounded-md hover:bg-muted/50 transition-colors border border-transparent hover:border-border">
                                                                    <div className="flex flex-col">
                                                                        <span className="text-sm font-medium">{cmd.name}</span>
                                                                        <span className="text-xs text-muted-foreground">{cmd.desc}</span>
                                                                    </div>
                                                                    <FormControl>
                                                                        <Switch
                                                                            checked={!field.value?.includes(cmd.name)}
                                                                            onCheckedChange={(checked: boolean) => {
                                                                                const current = field.value || [];
                                                                                if (checked) {
                                                                                    field.onChange(current.filter(c => c !== cmd.name));
                                                                                } else {
                                                                                    field.onChange([...current, cmd.name]);
                                                                                }
                                                                            }}
                                                                        />
                                                                    </FormControl>
                                                                </FormItem>
                                                            )}
                                                        />
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </TabsContent>

                            {/* Advanced Tab */}
                            <TabsContent value="advanced" className="space-y-4 pt-4">
                                <div className="grid grid-cols-2 gap-4 border p-4 rounded-lg">
                                    <FormField
                                        control={form.control}
                                        name="config.selfMode"
                                        render={({ field }) => (
                                            <FormItem className="flex items-center justify-between gap-2">
                                                <div className="space-y-0.5">
                                                    <FormLabel>Self Mode</FormLabel>
                                                    <p className="text-xs text-destructive font-medium">Restricted to Owner</p>
                                                </div>
                                                <FormControl>
                                                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                                                </FormControl>
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="config.cooldownMs"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Global Cooldown (ms)</FormLabel>
                                                <FormControl>
                                                    <Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value))} />
                                                </FormControl>
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                <div className="space-y-4 pt-4 border-t">
                                    <h4 className="text-sm font-medium">Sticker Metadata</h4>
                                    <div className="grid grid-cols-2 gap-4">
                                        <FormField
                                            control={form.control}
                                            name="config.stickerPackname"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Pack Name</FormLabel>
                                                    <FormControl>
                                                        <Input {...field} />
                                                    </FormControl>
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="config.stickerAuthor"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Author</FormLabel>
                                                    <FormControl>
                                                        <Input {...field} />
                                                    </FormControl>
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                </div>
                            </TabsContent>
                        </Tabs>

                        <DialogFooter className="pt-4 border-t gap-2 sm:gap-0">
                            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={isPending}>
                                {isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                                Save Configuration
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}

/**
 * Mock command data for the Command Store UI
 * In a real-world scenario, this would be fetched from a global metadata API
 */
function getMockCommands(category: string) {
    const commands: Record<string, { name: string; desc: string }[]> = {
        'Main': [
            { name: 'menu', desc: 'Display all available commands' },
            { name: 'ping', desc: 'Check bot responsiveness' },
            { name: 'uptime', desc: 'Show how long the bot has been running' },
        ],
        'Sticker': [
            { name: 'sticker', desc: 'Convert image/video to sticker' },
            { name: 'emojimix', desc: 'Combine two emojis into a sticker' },
        ],
        'AI': [
            { name: 'ai', desc: 'Chat with Gemini Pro' },
            { name: 'imagine', desc: 'Generate images from text' },
            { name: 'translate', desc: 'AI-powered translation' },
        ],
        'Downloader': [
            { name: 'instagram', desc: 'Download IG reels/posts' },
            { name: 'tiktok', desc: 'Download TT videos (no watermark)' },
            { name: 'youtube', desc: 'Download YT audio/video' },
        ],
        'Tool': [
            { name: 'screenshot', desc: 'Take a screenshot of a website' },
            { name: 'weather', desc: 'Get current weather info' },
            { name: 'shorten', desc: 'Shorten long URLs' },
        ]
    };

    return commands[category] || [];
}
