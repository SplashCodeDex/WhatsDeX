'use client';

import { Button } from '@/components/ui/button';
import { SearchIcon } from 'lucide-react';

/**
 * 404 - Not Found Page
 * 
 * Optimized for SSR/Hydration. Removed temporary mounted guard.
 */
export default function NotFound(): React.JSX.Element {
    return (
        <div className="flex min-h-screen flex-col items-center justify-center px-4 bg-background">
            <div className="text-center max-w-md animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="relative mb-8 flex justify-center">
                    <h1 className="text-[12rem] font-black leading-none text-muted/20 select-none">
                        404
                    </h1>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="rounded-full bg-primary/10 p-6 text-primary ring-8 ring-background">
                            <SearchIcon className="h-12 w-12" />
                        </div>
                    </div>
                </div>
                
                <h2 className="mb-4 text-3xl font-bold tracking-tight text-foreground">
                    Lost in Space?
                </h2>
                <p className="mb-10 text-muted-foreground text-balance">
                    The page you are looking for doesn&apos;t exist or has been moved to a new dimension.
                </p>
                
                <Button size="lg" className="px-8 font-bold shadow-glow" asChild>
                    <a href="/dashboard">Return to Safety</a>
                </Button>
            </div>
        </div>
    );
}
