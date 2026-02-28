'use client';

import { Suspense, useState } from 'react';
import {
    Search,
    Code2,
    Globe,
    Zap,
    Cpu,
    Lock,
    CheckCircle2,
    ShoppingCart,
    ExternalLink
} from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface Skill {
    id: string;
    title: string;
    description: string;
    icon: React.ElementType;
    isEligible: boolean;
    tier: 'starter' | 'pro' | 'enterprise';
    category: 'ai' | 'dev' | 'utility' | 'commerce';
    price?: string;
}

const SKILLS: Skill[] = [
    {
        id: 'web-search',
        title: 'Web Search',
        description: 'Allow your bot to search the live web for real-time information.',
        icon: Globe,
        isEligible: false,
        tier: 'pro',
        category: 'ai'
    },
    {
        id: 'math',
        title: 'Mathematics',
        description: 'Advanced calculation and formula solving capabilities.',
        icon: Zap,
        isEligible: true,
        tier: 'starter',
        category: 'utility'
    },
    {
        id: 'coding-agent',
        title: 'Coding Assistant',
        description: 'Analyze and generate code snippets across 20+ languages.',
        icon: Code2,
        isEligible: false,
        tier: 'enterprise',
        category: 'dev'
    },
    {
        id: 'image-gen',
        title: 'Image Generation',
        description: 'Create beautiful images using DALL-E 3 or Stable Diffusion.',
        icon: Cpu,
        isEligible: false,
        tier: 'pro',
        category: 'ai'
    },
    {
        id: 'checkout',
        title: 'Instant Checkout',
        description: 'Process payments directly inside the chat flow.',
        icon: ShoppingCart,
        isEligible: false,
        tier: 'enterprise',
        category: 'commerce'
    }
];

function SkillCard({ title, description, icon: Icon, isEligible, tier }: Skill) {
    return (
        <Card className={cn(
            "group relative overflow-hidden transition-all hover:shadow-lg border-border/40 bg-card/50 backdrop-blur-sm",
            !isEligible && "opacity-90"
        )}>
            {!isEligible && (
                <div className="absolute top-2 right-2 z-10">
                    <Lock className="h-4 w-4 text-muted-foreground/50" />
                </div>
            )}
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div className="rounded-xl bg-primary/10 p-2.5 text-primary group-hover:scale-110 transition-transform">
                        <Icon className="h-5 w-5" />
                    </div>
                    <Badge variant={tier === 'starter' ? 'secondary' : 'default'} className="uppercase text-[10px] tracking-wider font-bold">
                        {tier}
                    </Badge>
                </div>
                <CardTitle className="mt-4 text-lg">{title}</CardTitle>
                <CardDescription className="line-clamp-2 text-sm leading-relaxed">{description}</CardDescription>
            </CardHeader>
            <CardFooter className="pt-2">
                {isEligible ? (
                    <Button variant="outline" size="sm" className="w-full border-green-500/20 bg-green-500/5 hover:bg-green-500/10 text-green-600 dark:text-green-400">
                        <CheckCircle2 className="mr-2 h-4 w-4" />
                        Enabled
                    </Button>
                ) : (
                    <Button size="sm" className="w-full bg-primary/90 hover:bg-primary shadow-glow">
                        <Zap className="mr-2 h-4 w-4 fill-current" />
                        Upgrade to {tier.charAt(0).toUpperCase() + tier.slice(1)}
                    </Button>
                )}
            </CardFooter>
        </Card>
    );
}

export default function SkillsStorePage() {
    const [searchQuery, setSearchQuery] = useState('');

    const filteredSkills = SKILLS.filter(s => 
        s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.description.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-1.5">
                    <h2 className="text-4xl font-extrabold tracking-tight bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent">
                        Skills Store
                    </h2>
                    <p className="text-muted-foreground text-lg">
                        Extend your agents with autonomous capabilities and enterprise tools.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="relative w-full md:w-72">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input 
                            placeholder="Search skills..." 
                            className="pl-10 bg-background/50 border-border/40 focus:ring-primary/20"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <Badge variant="outline" className="px-4 py-1.5 h-10 border-primary/20 bg-primary/5 text-primary font-semibold">
                        Free Plan
                    </Badge>
                </div>
            </div>

            <Tabs defaultValue="all" className="w-full">
                <div className="flex items-center justify-between border-b border-border/40 mb-8">
                    <TabsList className="bg-transparent h-auto p-0 gap-8">
                        <TabsTrigger 
                            value="all" 
                            className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none pb-4 px-0 font-bold"
                        >
                            All Skills
                        </TabsTrigger>
                        <TabsTrigger 
                            value="ai" 
                            className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none pb-4 px-0 font-bold"
                        >
                            AI & Reasoning
                        </TabsTrigger>
                        <TabsTrigger 
                            value="utility" 
                            className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none pb-4 px-0 font-bold"
                        >
                            Utilities
                        </TabsTrigger>
                        <TabsTrigger 
                            value="commerce" 
                            className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none pb-4 px-0 font-bold"
                        >
                            Commerce
                        </TabsTrigger>
                    </TabsList>
                </div>

                <TabsContent value="all" className="mt-0">
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        {filteredSkills.map((skill) => (
                            <SkillCard key={skill.id} {...skill} />
                        ))}
                    </div>
                </TabsContent>
                
                <TabsContent value="ai" className="mt-0">
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        {filteredSkills.filter(s => s.category === 'ai').map((skill) => (
                            <SkillCard key={skill.id} {...skill} />
                        ))}
                    </div>
                </TabsContent>

                <TabsContent value="utility" className="mt-0">
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        {filteredSkills.filter(s => s.category === 'utility').map((skill) => (
                            <SkillCard key={skill.id} {...skill} />
                        ))}
                    </div>
                </TabsContent>

                <TabsContent value="commerce" className="mt-0">
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        {filteredSkills.filter(s => s.category === 'commerce').map((skill) => (
                            <SkillCard key={skill.id} {...skill} />
                        ))}
                    </div>
                </TabsContent>
            </Tabs>

            <Card className="overflow-hidden border-none bg-gradient-to-br from-primary/20 via-accent/5 to-background p-1">
                <div className="rounded-[calc(var(--radius)-1px)] bg-card/80 backdrop-blur-xl p-10 border border-white/10">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-8 text-center md:text-left">
                        <div className="space-y-3">
                            <h3 className="text-2xl font-bold tracking-tight">Need a custom skill?</h3>
                            <p className="text-muted-foreground max-w-xl text-balance">
                                Enterprise customers can build and deploy private skills tailored to their unique business workflows. Integrate with your internal APIs and proprietary models.
                            </p>
                        </div>
                        <div className="flex items-center gap-4 shrink-0">
                            <Button variant="outline" className="h-12 px-6 font-bold">
                                Request Access
                            </Button>
                            <Button variant="default" className="h-12 px-6 font-bold shadow-glow">
                                <ExternalLink className="mr-2 h-4 w-4" />
                                Developer SDK
                            </Button>
                        </div>
                    </div>
                </div>
            </Card>
        </div>
    );
}
