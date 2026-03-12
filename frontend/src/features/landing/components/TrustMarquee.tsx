'use client';

import { motion } from 'framer-motion';
import { ShieldCheck, Hexagon, Box, Layers, Globe2, Activity } from 'lucide-react';

const LOGOS = [
    { name: 'Acme Corp', icon: Hexagon },
    { name: 'GlobalNet', icon: Globe2 },
    { name: 'SecureData', icon: ShieldCheck },
    { name: 'LayerStack', icon: Layers },
    { name: 'PulseAnalytics', icon: Activity },
    { name: 'BoxedSolutions', icon: Box },
];

export function TrustMarquee() {
    // Duplicate the logos array to create a seamless infinite scroll loop
    const marqueeItems = [...LOGOS, ...LOGOS, ...LOGOS];

    return (
        <section className="w-full overflow-hidden border-y border-border/50 bg-muted/10 py-10 backdrop-blur-sm">
            <div className="mx-auto mb-6 max-w-6xl px-4 text-center">
                <p className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
                    Trusted by innovative teams worldwide
                </p>
            </div>
            
            <div className="relative flex w-full overflow-hidden">
                {/* Gradient Masks for smooth fade out on the edges */}
                <div className="pointer-events-none absolute left-0 top-0 z-10 h-full w-24 bg-gradient-to-r from-background to-transparent md:w-48" />
                <div className="pointer-events-none absolute right-0 top-0 z-10 h-full w-24 bg-gradient-to-l from-background to-transparent md:w-48" />

                <motion.div
                    className="flex shrink-0 items-center gap-16 md:gap-24 hover:[animation-play-state:paused]"
                    animate={{ x: ['0%', '-33.33%'] }}
                    transition={{
                        repeat: Infinity,
                        ease: 'linear',
                        duration: 30, // Adjusted speed slightly
                    }}
                    whileHover={{ animationPlayState: 'paused' }} // Framer motion specific
                >
                    {marqueeItems.map((item, index) => {
                        const Icon = item.icon;
                        const isDuplicate = index >= LOGOS.length;

                        return (
                            <div 
                                key={index} 
                                className="flex items-center gap-2 opacity-50 grayscale transition-all hover:opacity-100 hover:grayscale-0 cursor-default"
                                aria-hidden={isDuplicate}
                            >
                                <Icon className="h-6 w-6 text-foreground" />
                                <span className="text-lg font-bold text-foreground">
                                    {item.name}
                                </span>
                            </div>
                        );
                    })}
                </motion.div>
            </div>
        </section>
    );
}
