'use client';

import React, { useState } from 'react';
import { useCreateCampaign } from '../hooks/useCampaigns';
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
    Clock
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
    scheduleType: 'immediate' | 'scheduled';
    scheduledAt: string;
}

export function CampaignWizard() {
    const [step, setStep] = useState<Step>('audience');
    const { data: audiences } = useAudiences();
    const { data: templates } = useTemplates();
    const { data: bots } = useBots();
    const createMutation = useCreateCampaign();
    const spinMutation = useSpinMessage();

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
        scheduleType: 'immediate',
        scheduledAt: ''
    });

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
        createMutation.mutate({
            name: formData.name || `Campaign ${new Date().toLocaleDateString()}`,
            templateId: formData.templateId,
            audience: { type: formData.audienceType, targetId: formData.targetId },
            distribution: { type: formData.distributionType, botId: formData.botId },
            antiBan: { 
                aiSpinning: formData.aiSpinning, 
                minDelay: formData.minDelay, 
                maxDelay: formData.maxDelay 
            },
            schedule: { 
                type: formData.scheduleType, 
                ...(formData.scheduledAt ? { scheduledAt: new Date(formData.scheduledAt).toISOString() } : {})
            }
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
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs font-bold uppercase text-muted-foreground">Target Audience</Label>
                            <Select 
                                value={formData.targetId} 
                                onValueChange={(val: string) => setFormData(prev => ({ ...prev, targetId: val }))}
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
                                            formData.distributionType === 'single' ? "border-primary bg-primary/10" : "border-border hover:border-border/80"
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
                                            formData.distributionType === 'pool' ? "border-primary bg-primary/10" : "border-border hover:border-border/80"
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
                                        />
                                        <Input 
                                            type="number" 
                                            value={formData.maxDelay} 
                                            onChange={e => setFormData(prev => ({ ...prev, maxDelay: Number(e.target.value) }))}
                                            className="h-10"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {formData.distributionType === 'single' && (
                            <div className="space-y-2">
                                <Label className="text-xs font-bold uppercase text-muted-foreground">Select Sending Bot</Label>
                                <Select 
                                    value={formData.botId} 
                                    onValueChange={(val: string) => setFormData(prev => ({ ...prev, botId: val }))}
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
                    disabled={step === 'audience'}
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
                            (step === 'distribution' && formData.distributionType === 'single' && !formData.botId)
                        }
                    >
                        Next Step <ChevronRight className="w-4 h-4 ml-2" />
                    </Button>
                ) : (
                    <Button 
                        onClick={handleSubmit}
                        disabled={createMutation.isPending}
                        className="px-10 font-bold uppercase tracking-widest text-[10px] shadow-xl shadow-primary/30 h-12"
                    >
                        {createMutation.isPending ? (
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            <>Confirm & Launch <Send className="w-4 h-4 ml-2" /></>
                        )}
                    </Button>
                )}
            </CardFooter>
        </Card>
    );
}