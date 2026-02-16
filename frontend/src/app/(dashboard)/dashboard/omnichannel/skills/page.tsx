import { Suspense } from 'react';
import { Metadata } from 'next';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export const metadata: Metadata = {
    title: 'Skills Store',
    description: 'Enhance your bots with powerful new capabilities',
};

interface SkillCardProps {
    id: string;
    title: string;
    description: string;
    icon: React.ElementType;
    isEligible: boolean;
    tier: 'starter' | 'pro' | 'enterprise';
    category: string;
}

const SKILLS: SkillCardProps[] = [
    {
        id: 'web-search',
        title: 'Web Search',
        description: 'Allow your bot to search the live web for real-time information.',
        icon: Globe,
        isEligible: false,
        tier: 'pro',
        category: 'AI & Search'
    },
    {
        id: 'math',
        title: 'Mathematics',
        description: 'Advanced calculation and formula solving capabilities.',
        icon: Zap,
        isEligible: true,
        tier: 'starter',
        category: 'Core Utilities'
    },
    {
        id: 'coding-agent',
        title: 'Coding Assistant',
        description: 'Analyze and generate code snippets across 20+ languages.',
        icon: Code2,
        isEligible: false,
        tier: 'enterprise',
        category: 'Developer Tools'
    },
    {
        id: 'image-gen',
        title: 'Image Generation',
        description: 'Create beautiful images using DALL-E 3 or Stable Diffusion.',
        icon: Cpu,
        isEligible: false,
        tier: 'pro',
        category: 'AI & Search'
    }
];

function SkillCard({ title, description, icon: Icon, isEligible, tier }: SkillCardProps) {
    return (
        <Card className={cn(
            "group relative overflow-hidden transition-all hover:shadow-md",
            !isEligible && "opacity-80"
        )}>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div className="rounded-lg bg-primary/10 p-2 text-primary">
                        <Icon className="h-5 w-5" />
                    </div>
                    <Badge variant={tier === 'starter' ? 'secondary' : 'default'} className="uppercase text-[10px]">
                        {tier}
                    </Badge>
                </div>
                <CardTitle className="mt-4">{title}</CardTitle>
                <CardDescription className="line-clamp-2">{description}</CardDescription>
            </CardHeader>
            <CardFooter>
                {isEligible ? (
                    <Button variant="outline" size="sm" className="w-full">
                        <CheckCircle2 className="mr-2 h-4 w-4 text-green-500" />
                        Enabled
                    </Button>
                ) : (
                    <Button size="sm" className="w-full">
                        <Lock className="mr-2 h-4 w-4" />
                        Upgrade to {tier.charAt(0).toUpperCase() + tier.slice(1)}
                    </Button>
                )}
            </CardFooter>
        </Card>
    );
}

export default function SkillsStorePage() {
    return (
        <div className="space-y-8 text-foreground">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Skills Store</h2>
                    <p className="text-muted-foreground">
                        Supercharge your bots with ready-to-use plugins and AI capabilities.
                    </p>
                </div>
                <div className="flex space-x-2">
                    <Badge variant="outline" className="px-3 py-1">
                        Current Tier: Starter
                    </Badge>
                </div>
            </div>

            <Tabs defaultValue="all" className="w-full">
                <TabsList className="grid w-full grid-cols-4 max-w-md">
                    <TabsTrigger value="all">All</TabsTrigger>
                    <TabsTrigger value="ai">AI & Search</TabsTrigger>
                    <TabsTrigger value="dev">Dev Tools</TabsTrigger>
                    <TabsTrigger value="utility">Utility</TabsTrigger>
                </TabsList>
                
                <TabsContent value="all" className="mt-6">
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        {SKILLS.map((skill) => (
                            <SkillCard key={skill.id} {...skill} />
                        ))}
                    </div>
                </TabsContent>
            </Tabs>

            <div className="rounded-2xl bg-gradient-to-r from-primary/10 via-accent/10 to-primary/10 p-8 border border-primary/20">
                <div className="flex flex-col md:flex-row items-center justify-between gap-6 text-foreground">
                    <div className="space-y-2">
                        <h3 className="text-xl font-bold">Need a custom skill?</h3>
                        <p className="text-muted-foreground max-w-lg">
                            Enterprise customers can build and deploy private skills tailored to their unique business workflows.
                        </p>
                    </div>
                    <Button variant="default" className="shrink-0">
                        <ExternalLink className="mr-2 h-4 w-4" />
                        Developer Documentation
                    </Button>
                </div>
            </div>
        </div>
    );
}
