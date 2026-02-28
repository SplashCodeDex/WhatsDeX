'use client';

import React, { useState, useActionState, useEffect, startTransition } from 'react';
import { useTemplates, useSpinMessage } from '../hooks/useTemplates';
import { useAudiences } from '../hooks/useAudiences';
import { useBots } from '@/features/bots/hooks/useBots';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Users,
    MessageSquare,
    Zap,
    Settings2,
    ChevronRight,
    ChevronLeft,
    Send,
    Sparkles,
    CheckCircle2,
    Layout,
    Clock,
    Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { createCampaign } from '../actions';
import { toast } from 'sonner';

type Step = 'audience' | 'template' | 'distribution' | 'review';

interface CampaignFormData {
    name: string;
    templateId: string;
    targetId: string;
    audienceType: 'audience' | 'contacts' | 'groups';
    distributionType: 'single' | 'pool';
    botId: string;
    aiSpinning: boolean;
    minDelay: number;
    maxDelay: number;
    // Human Path fields
    batchSize: number;
    batchPauseMin: number;
    batchPauseMax: number;
    workingHoursEnabled: boolean;
    workingHoursStart: string;
    workingHoursEnd: string;
    timezone: string;
    typingSimulation: boolean;
    maxTypingDelay: number;
    scheduleType: 'immediate' | 'scheduled';
    scheduledAt: string;
}

export function CampaignWizard() {
    const [step, setStep] = useState<Step>('audience');
    const { data: audiences } = useAudiences();
    const { data: templates } = useTemplates();
    const { data: bots } = useBots('system_default');

    const [state, dispatch, isPending] = useActionState(createCampaign, null);

    const [formData, setFormData] = useState<CampaignFormData>({
        name: '',
        templateId: '',
        targetId: '',
        audienceType: 'audience',
        distributionType: 'single',
        botId: '',
        aiSpinning: false,
        minDelay: 10,
        maxDelay: 30,
        batchSize: 20,
        batchPauseMin: 5,
        batchPauseMax: 15,
        workingHoursEnabled: false,
        workingHoursStart: '08:00',
        workingHoursEnd: '20:00',
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
        typingSimulation: true,
        maxTypingDelay: 5,
        scheduleType: 'immediate',
        scheduledAt: ''
    });

    useEffect(() => {
        if (state?.success) {
            toast.success('Campaign created successfully');
            // Navigate or reset here if needed.
        } else if (state?.success === false) {
            toast.error(state.error.message || 'Failed to create campaign');
        }
    }, [state]);

    const steps: { id: Step; label: string; icon: any }[] = [
        { id: 'audience', label: 'Audience', icon: Users },
        { id: 'template', label: 'Template', icon: MessageSquare },
        { id: 'distribution', label: 'Distribution', icon: Zap },
        { id: 'review', label: 'Review', icon: CheckCircle2 }
    ];

    const handleNext = () => {
        if (step === 'audience') setStep('template');
        else if (step === 'template') setStep('distribution');
        else if (step === 'distribution') setStep('review');
    };

    const handleBack = () => {
        if (step === 'template') setStep('audience');
        else if (step === 'distribution') setStep('template');
        else if (step === 'review') setStep('distribution');
    };

    const handleSubmit = () => {
        const payload = {
            name: formData.name || `Campaign ${new Date().toLocaleDateString()}`,
            templateId: formData.templateId,
            audience: { type: formData.audienceType, targetId: formData.targetId },
            distribution: { type: formData.distributionType, botId: formData.botId },
            antiBan: {
                aiSpinning: formData.aiSpinning,
                minDelay: formData.minDelay,
                maxDelay: formData.maxDelay,
                batchSize: formData.batchSize,
                batchPauseMin: formData.batchPauseMin,
                batchPauseMax: formData.batchPauseMax,
                workingHoursEnabled: formData.workingHoursEnabled,
                workingHoursStart: formData.workingHoursStart,
                workingHoursEnd: formData.workingHoursEnd,
                timezone: formData.timezone,
                typingSimulation: formData.typingSimulation,
                maxTypingDelay: formData.maxTypingDelay
            },
            schedule: {
                type: formData.scheduleType,
                ...(formData.scheduledAt ? { scheduledAt: new Date(formData.scheduledAt).toISOString() } : {})
            }
        };

        const fd = new FormData();
        fd.append('data', JSON.stringify(payload));
        startTransition(() => {
            dispatch(fd);
        });
    };

    return (
        <Card className="max-w-4xl mx-auto border-border/40 bg-background/50 backdrop-blur-xl">
            <CardHeader className="border-b border-border/20">
                <div className="flex items-center justify-between mb-8">
                    {steps.map((s, i) => (
                        <div key={s.id} className="flex items-center">
                            <div className={cn(
                                "flex flex-col items-center gap-2",
                                step === s.id ? "text-primary" : "text-muted-foreground"
                            )}>
                                <div className={cn(
                                    "w-10 h-10 rounded-full border-2 flex items-center justify-center transition-all",
                                    step === s.id ? "border-primary bg-primary/10 shadow-lg shadow-primary/20" : "border-muted bg-muted/5"
                                )}>
                                    <s.icon className="w-5 h-5" />
                                </div>
                                <span className="text-[10px] font-bold uppercase tracking-widest">{s.label}</span>
                            </div>
                            {i < steps.length - 1 && (
                                <div className="w-20 h-px bg-border mx-4 -mt-6" />
                            )}
                        </div>
                    ))}
                </div>
                <CardTitle className="text-2xl font-black tracking-tight">
                    {step === 'audience' && "Who are we reaching?"}
                    {step === 'template' && "What are we saying?"}
                    {step === 'distribution' && "How are we sending?"}
                    {step === 'review' && "Ready to launch?"}
                </CardTitle>
                <CardDescription>
                    {step === 'audience' && "Select the audience or contact group for this broadcast."}
                    {step === 'template' && "Choose a template and personalize it with variables."}
                    {step === 'distribution' && "Configure delivery speed and multi-bot pooling."}
                    {step === 'review' && "Review your campaign settings before confirming."}
                </CardDescription>
            </CardHeader>

            <CardContent className="py-10">
                {step === 'audience' && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
                        <div className="space-y-2">
                            <Label className="text-xs font-bold uppercase text-muted-foreground">Campaign Name</Label>
                            <Input
                                placeholder="e.g. Anniversary Special Sale"
                                value={formData.name}
                                onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                className="h-12 text-lg font-medium"
                                disabled={isPending}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs font-bold uppercase text-muted-foreground">Target Audience</Label>
                            <Select
                                value={formData.targetId}
                                onValueChange={(val: string) => setFormData(prev => ({ ...prev, targetId: val }))}
                                disabled={isPending}
                            >
                                <SelectTrigger className="h-12">
                                    <SelectValue placeholder="Select an Audience" />
                                </SelectTrigger>
                                <SelectContent>
                                    {audiences?.map(aud => (
                                        <SelectItem key={aud.id} value={aud.id}>{aud.name} ({aud.count} contacts)</SelectItem>
                                    ))}
                                    {(!audiences || audiences.length === 0) && (
                                        <SelectItem value="none" disabled>No audiences found. Import contacts first.</SelectItem>
                                    )}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                )}

                {step === 'template' && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
                        <div className="space-y-2">
                            <Label className="text-xs font-bold uppercase text-muted-foreground">Message Template</Label>
                            <Select
                                value={formData.templateId}
                                onValueChange={(val: string) => setFormData(prev => ({ ...prev, templateId: val }))}
                                disabled={isPending}
                            >
                                <SelectTrigger className="h-12">
                                    <SelectValue placeholder="Choose a template" />
                                </SelectTrigger>
                                <SelectContent>
                                    {templates?.map(tpl => (
                                        <SelectItem key={tpl.id} value={tpl.id}>{tpl.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {formData.templateId && (
                            <div className="p-6 rounded-2xl border border-primary/20 bg-primary/5 relative">
                                <Badge className="absolute -top-3 left-4 bg-primary text-primary-foreground">Preview</Badge>
                                <div className="text-lg leading-relaxed">
                                    {templates?.find(t => t.id === formData.templateId)?.content}
                                </div>
                                <div className="mt-6 flex items-center justify-between border-t border-primary/10 pt-4">
                                    <div className="flex items-center gap-2 text-xs text-primary font-bold">
                                        <Sparkles className="w-4 h-4" />
                                        AI Message Spinning Enabled
                                    </div>
                                    <Switch
                                        checked={formData.aiSpinning}
                                        onCheckedChange={(val: boolean) => setFormData(prev => ({ ...prev, aiSpinning: val }))}
                                        disabled={isPending}
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {step === 'distribution' && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-4">
                                <Label className="text-xs font-bold uppercase text-muted-foreground">Distribution Strategy</Label>
                                <div className="grid grid-cols-1 gap-3">
                                    <div
                                        className={cn(
                                            "p-4 rounded-xl border-2 cursor-pointer transition-all",
                                            formData.distributionType === 'single' ? "border-primary bg-primary/10" : "border-border hover:border-border/80",
                                            isPending && "pointer-events-none opacity-50"
                                        )}
                                        onClick={() => setFormData(prev => ({ ...prev, distributionType: 'single' }))}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 rounded-lg bg-background border border-border">
                                                <Layout className="w-4 h-4" />
                                            </div>
                                            <div>
                                                <div className="font-bold">Single Bot</div>
                                                <div className="text-[10px] text-muted-foreground uppercase font-bold tracking-tighter">Recommended for Starter</div>
                                            </div>
                                        </div>
                                    </div>
                                    <div
                                        className={cn(
                                            "p-4 rounded-xl border-2 cursor-pointer transition-all",
                                            formData.distributionType === 'pool' ? "border-primary bg-primary/10" : "border-border hover:border-border/80",
                                            isPending && "pointer-events-none opacity-50"
                                        )}
                                        onClick={() => setFormData(prev => ({ ...prev, distributionType: 'pool' }))}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 rounded-lg bg-background border border-border text-primary">
                                                <Sparkles className="w-4 h-4" />
                                            </div>
                                            <div>
                                                <div className="font-bold">Multi-Bot Pool</div>
                                                <div className="text-[10px] text-primary uppercase font-bold tracking-tighter">Enterprise Mode</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <Label className="text-xs font-bold uppercase text-muted-foreground">Throttle Settings</Label>
                                <div className="space-y-4 p-4 rounded-xl bg-muted/30 border border-border/40">
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm font-medium">Random Delay (Seconds)</span>
                                        <span className="text-xs font-black font-mono">{formData.minDelay}s - {formData.maxDelay}s</span>
                                    </div>
                                    <div className="flex gap-4">
                                        <Input
                                            type="number"
                                            value={formData.minDelay}
                                            onChange={e => setFormData(prev => ({ ...prev, minDelay: Number(e.target.value) }))}
                                            className="h-10"
                                            placeholder="Min"
                                            disabled={isPending}
                                        />
                                        <Input
                                            type="number"
                                            value={formData.maxDelay}
                                            onChange={e => setFormData(prev => ({ ...prev, maxDelay: Number(e.target.value) }))}
                                            className="h-10"
                                            placeholder="Max"
                                            disabled={isPending}
                                        />
                                    </div>

                                    <div className="pt-2 border-t border-border/40 mt-2">
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-[11px] font-bold uppercase text-muted-foreground flex items-center gap-2">
                                                <Zap className="w-3 h-3 text-warning" />
                                                Human Path (Batching)
                                            </span>
                                            <span className="text-[10px] font-mono bg-warning/10 text-warning px-1.5 py-0.5 rounded">ADVANCED</span>
                                        </div>
                                        <div className="grid grid-cols-2 gap-3 mt-3">
                                            <div className="space-y-1.5">
                                                <Label className="text-[10px] uppercase font-bold text-muted-foreground">Batch Size</Label>
                                                <Input
                                                    type="number"
                                                    value={formData.batchSize}
                                                    onChange={e => setFormData(prev => ({ ...prev, batchSize: Number(e.target.value) }))}
                                                    className="h-8 text-xs"
                                                    disabled={isPending}
                                                />
                                            </div>
                                            <div className="space-y-1.5">
                                                <Label className="text-[10px] uppercase font-bold text-muted-foreground">Batch Pause (Min)</Label>
                                                <div className="flex items-center gap-1">
                                                    <Input
                                                        type="number"
                                                        value={formData.batchPauseMin}
                                                        onChange={e => setFormData(prev => ({ ...prev, batchPauseMin: Number(e.target.value) }))}
                                                        className="h-8 text-xs px-2"
                                                        disabled={isPending}
                                                    />
                                                    <span className="text-[10px] text-muted-foreground">-</span>
                                                    <Input
                                                        type="number"
                                                        value={formData.batchPauseMax}
                                                        onChange={e => setFormData(prev => ({ ...prev, batchPauseMax: Number(e.target.value) }))}
                                                        className="h-8 text-xs px-2"
                                                        disabled={isPending}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="p-4 rounded-2xl bg-primary/5 border border-primary/20">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-lg bg-primary/10 text-primary">
                                        <Clock className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <div className="font-bold text-sm">Working Hours Constraint</div>
                                        <div className="text-[10px] text-muted-foreground">Only send messages during specific times to avoid bans</div>
                                    </div>
                                </div>
                                <Switch
                                    checked={formData.workingHoursEnabled}
                                    onCheckedChange={(val: boolean) => setFormData(prev => ({ ...prev, workingHoursEnabled: val }))}
                                    disabled={isPending}
                                />
                            </div>
                            {formData.workingHoursEnabled && (
                                <div className="mt-4 grid grid-cols-3 gap-4 animate-in fade-in slide-in-from-top-2">
                                    <div className="space-y-1.5">
                                        <Label className="text-[10px] uppercase font-bold text-muted-foreground text-center block">Timezone</Label>
                                        <Select
                                            value={formData.timezone}
                                            onValueChange={(val: string) => setFormData(prev => ({ ...prev, timezone: val }))}
                                            disabled={isPending}
                                        >
                                            <SelectTrigger className="h-9 text-xs">
                                                <SelectValue placeholder="Select Timezone" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="UTC">UTC (Universal)</SelectItem>
                                                <SelectItem value="America/New_York">Eastern (ET)</SelectItem>
                                                <SelectItem value="America/Chicago">Central (CT)</SelectItem>
                                                <SelectItem value="America/Denver">Mountain (MT)</SelectItem>
                                                <SelectItem value="America/Los_Angeles">Pacific (PT)</SelectItem>
                                                <SelectItem value="Europe/London">London (GMT)</SelectItem>
                                                <SelectItem value="Africa/Lagos">Lagos (WAT)</SelectItem>
                                                <SelectItem value="Asia/Dubai">Dubai (GST)</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="text-[10px] uppercase font-bold text-muted-foreground text-center block">Start</Label>
                                        <Input
                                            type="time"
                                            value={formData.workingHoursStart}
                                            onChange={e => setFormData(prev => ({ ...prev, workingHoursStart: e.target.value }))}
                                            className="h-9"
                                            disabled={isPending}
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="text-[10px] uppercase font-bold text-muted-foreground text-center block">End</Label>
                                        <Input
                                            type="time"
                                            value={formData.workingHoursEnd}
                                            onChange={e => setFormData(prev => ({ ...prev, workingHoursEnd: e.target.value }))}
                                            className="h-9"
                                            disabled={isPending}
                                        />
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="p-4 rounded-2xl bg-warning/5 border border-warning/20">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-lg bg-warning/10 text-warning">
                                        <MessageSquare className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <div className="font-bold text-sm">Typing Simulation</div>
                                        <div className="text-[10px] text-muted-foreground">Mimics human typing before sending each message</div>
                                    </div>
                                </div>
                                <Switch
                                    checked={formData.typingSimulation}
                                    onCheckedChange={(val: boolean) => setFormData(prev => ({ ...prev, typingSimulation: val }))}
                                    disabled={isPending}
                                />
                            </div>
                            {formData.typingSimulation && (
                                <div className="mt-4 space-y-2 animate-in fade-in slide-in-from-top-2">
                                    <div className="flex justify-between items-center text-[10px] font-bold uppercase text-muted-foreground mb-1">
                                        <span>Max Typing Delay (Seconds)</span>
                                        <span className="text-warning font-mono">{formData.maxTypingDelay}s</span>
                                    </div>
                                    <Input
                                        type="range"
                                        min="1"
                                        max="10"
                                        step="1"
                                        value={formData.maxTypingDelay}
                                        onChange={e => setFormData(prev => ({ ...prev, maxTypingDelay: Number(e.target.value) }))}
                                        className="h-4 accent-warning"
                                        disabled={isPending}
                                    />
                                </div>
                            )}
                        </div>

                        {formData.distributionType === 'single' && (
                            <div className="space-y-2">
                                <Label className="text-xs font-bold uppercase text-muted-foreground">Select Sending Bot</Label>
                                <Select
                                    value={formData.botId}
                                    onValueChange={(val: string) => setFormData(prev => ({ ...prev, botId: val }))}
                                    disabled={isPending}
                                >
                                    <SelectTrigger className="h-12">
                                        <SelectValue placeholder="Choose a bot" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {bots?.filter((b: any) => b.status === 'connected').map((bot: any) => (
                                            <SelectItem key={bot.id} value={bot.id}>{bot.name} ({bot.phoneNumber})</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}
                    </div>
                )}

                {step === 'review' && (
                    <div className="space-y-6 animate-in zoom-in-95 duration-500">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-4 rounded-2xl bg-muted/20 border border-border/40">
                                <div className="text-[10px] font-black uppercase text-muted-foreground mb-1">Target</div>
                                <div className="font-bold flex items-center gap-2">
                                    <Users className="w-4 h-4 text-primary" />
                                    {audiences?.find(a => a.id === formData.targetId)?.name || 'Unknown Audience'}
                                </div>
                            </div>
                            <div className="p-4 rounded-2xl bg-muted/20 border border-border/40">
                                <div className="text-[10px] font-black uppercase text-muted-foreground mb-1">Distribution</div>
                                <div className="font-bold flex items-center gap-2 uppercase text-xs tracking-widest">
                                    {formData.distributionType === 'pool' ? <Sparkles className="w-4 h-4 text-primary" /> : <Layout className="w-4 h-4" />}
                                    {formData.distributionType} mode
                                </div>
                            </div>
                        </div>

                        <div className="p-6 rounded-2xl bg-primary/5 border border-primary/20">
                            <div className="text-[10px] font-black uppercase text-primary mb-2">Message Content</div>
                            <div className="text-lg leading-relaxed">
                                {templates?.find(t => t.id === formData.templateId)?.content}
                            </div>
                            {formData.aiSpinning && (
                                <div className="mt-4 flex items-center gap-2 text-[10px] font-black uppercase text-primary bg-primary/10 w-fit px-2 py-1 rounded-md">
                                    <Sparkles className="w-3 h-3" />
                                    AI Variation Enabled
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </CardContent>

            <CardFooter className="border-t border-border/20 py-6 flex justify-between bg-muted/5">
                <Button
                    variant="ghost"
                    onClick={handleBack}
                    disabled={step === 'audience' || isPending}
                    className="font-bold uppercase tracking-widest text-[10px]"
                >
                    <ChevronLeft className="w-4 h-4 mr-2" /> Back
                </Button>

                {step !== 'review' ? (
                    <Button
                        onClick={handleNext}
                        className="px-8 font-bold uppercase tracking-widest text-[10px] shadow-lg shadow-primary/20"
                        disabled={
                            (step === 'audience' && !formData.targetId) ||
                            (step === 'template' && !formData.templateId) ||
                            (step === 'distribution' && formData.distributionType === 'single' && !formData.botId) ||
                            isPending
                        }
                    >
                        Next Step <ChevronRight className="w-4 h-4 ml-2" />
                    </Button>
                ) : (
                    <Button
                        onClick={handleSubmit}
                        disabled={isPending}
                        className="px-10 font-bold uppercase tracking-widest text-[10px] shadow-xl shadow-primary/30 h-12"
                    >
                        {isPending ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                            <>Confirm & Launch <Send className="w-4 h-4 ml-2" /></>
                        )}
                    </Button>
                )}
            </CardFooter>
        </Card>
    );
}
