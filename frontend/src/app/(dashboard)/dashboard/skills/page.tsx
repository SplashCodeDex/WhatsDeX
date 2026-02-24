'use client';

import { useEffect, useState } from 'react';
import {
    Zap,
    Search,
    RefreshCw,
    Lock,
    CheckCircle2,
    Download,
    Settings2,
    ShieldAlert,
    ExternalLink,
    Terminal,
    Key
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useOmnichannelStore } from '@/stores/useOmnichannelStore';
import { useAuth } from '@/features/auth';
import { toast } from 'sonner';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

export default function SkillsStorePage() {
    const { skillReport, fetchSkillReport, toggleSkill, saveSkillKey, installSkill, isLoading } = useOmnichannelStore();
    const { user } = useAuth();
    const [searchQuery, setSearchQuery] = useState('');
    const [isRefreshing, setIsRefreshing] = useState(false);

    const [keyDialogOpen, setKeyDialogOpen] = useState(false);
    const [selectedSkillKey, setSelectedSkillKey] = useState<string | null>(null);
    const [apiKey, setApiKey] = useState('');

    const handleRefresh = async () => {
        setIsRefreshing(true);
        await fetchSkillReport();
        setIsRefreshing(false);
    };

    useEffect(() => {
        handleRefresh();
    }, []);

    const filteredSkills = skillReport?.skills.filter(skill =>
        skill.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        skill.description.toLowerCase().includes(searchQuery.toLowerCase())
    ) || [];

    const handleToggle = async (key: string, currentDisabled: boolean) => {
        const success = await toggleSkill(key, currentDisabled);
        if (success) {
            toast.success(`Skill ${currentDisabled ? 'enabled' : 'disabled'} successfully`);
        }
    };

    const handleInstall = async (key: string, installId: string) => {
        const success = await installSkill(key, installId);
        if (success) {
            toast.success('Skill installation initiated');
        }
    };

    const handleSaveKey = async () => {
        if (!selectedSkillKey) return;
        const success = await saveSkillKey(selectedSkillKey, apiKey);
        if (success) {
            toast.success('API key saved successfully');
            setKeyDialogOpen(false);
            setApiKey('');
        }
    };

    const userTier = user?.plan || 'starter';

    // Tier gating logic (Pro/Enterprise only skills)
    const isPremiumSkill = (skillId: string) => {
        const premiumSkills = ['web-search', 'firecrawl', 'brave-search', 'perplexity'];
        return premiumSkills.includes(skillId);
    };

    const isEnterpriseSkill = (skillId: string) => {
        const enterpriseSkills = ['coding-agent', 'custom-hooks'];
        return enterpriseSkills.includes(skillId);
    };

    const canAccess = (skillId: string) => {
        if (isEnterpriseSkill(skillId)) return userTier === 'enterprise';
        if (isPremiumSkill(skillId)) return userTier === 'pro' || userTier === 'enterprise';
        return true;
    };

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-foreground font-foreground">Intelligence Store</h2>
                    <p className="text-muted-foreground">
                        Enhance your bots with powerful skills, from web search to specialized analysis.
                    </p>
                </div>
                <div className="flex space-x-2">
                    <Button variant="outline" size="icon" onClick={handleRefresh} disabled={isRefreshing}>
                        <RefreshCw className={cn("h-4 w-4", isRefreshing && "animate-spin")} />
                    </Button>
                </div>
            </div>

            <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                    placeholder="Search skills (e.g. 'search', 'weather')..."
                    className="pl-10"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>

            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                {filteredSkills.length === 0 && !isLoading ? (
                    <div className="col-span-full py-12 text-center border-2 border-dashed rounded-xl">
                        <Zap className="h-12 w-12 text-muted-foreground/20 mx-auto mb-4" />
                        <p className="text-muted-foreground">No skills found matching your search.</p>
                    </div>
                ) : (
                    filteredSkills.map((skill) => {
                        const accessible = canAccess(skill.skillKey);
                        const isInstalled = skill.missing.bins.length === 0;
                        const needsKey = Boolean(skill.primaryEnv);

                        return (
                            <Card key={skill.skillKey} className={cn(
                                "flex flex-col border-border/50 bg-card transition-all hover:shadow-md",
                                !accessible && "opacity-75 grayscale-[0.5]"
                            )}>
                                <CardHeader>
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-center space-x-2">
                                            <div className="rounded-lg bg-primary/10 p-2 text-primary">
                                                {skill.emoji ? <span className="text-xl">{skill.emoji}</span> : <Zap className="h-5 w-5" />}
                                            </div>
                                            <div>
                                                <CardTitle className="text-lg">{skill.name}</CardTitle>
                                                <CardDescription className="text-xs">{skill.source}</CardDescription>
                                            </div>
                                        </div>
                                        {!accessible && (
                                            <Badge variant="outline" className="bg-orange-500/10 text-orange-500 border-orange-500/20">
                                                <Lock className="mr-1 h-3 w-3" />
                                                {isEnterpriseSkill(skill.skillKey) ? 'Enterprise' : 'Pro'}
                                            </Badge>
                                        )}
                                    </div>
                                </CardHeader>
                                <CardContent className="flex-1">
                                    <p className="text-sm text-muted-foreground line-clamp-3 mb-4">
                                        {skill.description}
                                    </p>

                                    <div className="space-y-2">
                                        {skill.missing.bins.map(bin => (
                                            <div key={bin} className="flex items-center text-[10px] text-destructive">
                                                <ShieldAlert className="mr-1 h-3 w-3" />
                                                Missing dependency: {bin}
                                            </div>
                                        ))}
                                        {isInstalled && (
                                            <div className="flex items-center text-[10px] text-green-500">
                                                <CheckCircle2 className="mr-1 h-3 w-3" />
                                                All dependencies satisfied
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                                <CardFooter className="border-t bg-muted/30 pt-4 flex flex-col space-y-2">
                                    <div className="flex w-full space-x-2">
                                        {accessible ? (
                                            <>
                                                {isInstalled ? (
                                                    <Button
                                                        variant={skill.disabled ? "default" : "outline"}
                                                        className="flex-1"
                                                        onClick={() => handleToggle(skill.skillKey, skill.disabled)}
                                                    >
                                                        {skill.disabled ? 'Enable Skill' : 'Disable Skill'}
                                                    </Button>
                                                ) : (
                                                    skill.install.length > 0 && skill.install[0] && (
                                                        <Button
                                                            variant="default"
                                                            className="flex-1"
                                                            onClick={() => handleInstall(skill.skillKey, skill.install[0]!.id)}
                                                        >
                                                            <Download className="mr-2 h-4 w-4" />
                                                            Install {skill.install[0]!.label}
                                                        </Button>
                                                    )
                                                )}
                                                {needsKey && (
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => { setSelectedSkillKey(skill.skillKey); setKeyDialogOpen(true); }}
                                                        title="Configure API Key"
                                                    >
                                                        <Key className="h-4 w-4" />
                                                    </Button>
                                                )}
                                            </>
                                        ) : (
                                            <Button variant="secondary" className="flex-1 w-full" asChild>
                                                <a href="/dashboard/billing">Upgrade to Unlock</a>
                                            </Button>
                                        )}
                                    </div>
                                    {skill.homepage && (
                                        <a
                                            href={skill.homepage}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="text-[10px] text-muted-foreground hover:text-primary flex items-center self-center"
                                        >
                                            Documentation <ExternalLink className="ml-1 h-2 w-2" />
                                        </a>
                                    )}
                                </CardFooter>
                            </Card>
                        );
                    })
                )}
            </div>

            <Dialog open={keyDialogOpen} onOpenChange={setKeyDialogOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Configure API Key</DialogTitle>
                        <DialogDescription>
                            Enter the API key required for this skill. This will be stored securely in your environment config.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="apiKey">API Key</Label>
                            <Input
                                id="apiKey"
                                type="password"
                                placeholder="sk-..."
                                value={apiKey}
                                onChange={(e) => setApiKey(e.target.value)}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setKeyDialogOpen(false)}>Cancel</Button>
                        <Button onClick={handleSaveKey}>Save Changes</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
