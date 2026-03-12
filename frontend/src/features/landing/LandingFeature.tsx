'use client';

import Link from 'next/link';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import { Button } from '@/components/ui/button';
import { motion, useScroll, useMotionValueEvent } from 'framer-motion';
import { useState } from 'react';
import { MessageSquare, ArrowRight } from 'lucide-react';
import { TrustMarquee } from './components/TrustMarquee';
import { BentoFeatures } from './components/BentoFeatures';
import { SocialProof } from './components/SocialProof';
import { ThemeToggle } from '@/components/ui/theme-toggle';

const SplineRobot = dynamic(() => import('@/components/landing/SplineRobot').then(mod => mod.SplineRobot), {
    ssr: false,
    loading: () => <div className="absolute inset-0 bg-background/20 backdrop-blur-sm" />
});

export function LandingFeature() {
    const { scrollY } = useScroll();
    const [showStickyCTA, setShowStickyCTA] = useState(false);

    useMotionValueEvent(scrollY, "change", (latest) => {
        // Show sticky CTA after scrolling down 600px (past the hero)
        if (latest > 600) {
            setShowStickyCTA(true);
        } else {
            setShowStickyCTA(false);
        }
    });

    return (
        <div className="flex min-h-screen flex-col relative overflow-x-hidden">
            {/* Quantum Hero Section */}
            <section className="relative h-screen w-full flex items-center justify-center bg-background overflow-hidden px-4">
                {/* 3D Asset Background - Raw Mode */}
                <SplineRobot 
                    className="absolute inset-0 z-0 h-full w-full"
                    sceneUrl="https://prod.spline.design/ZZfs8HZoLfxM5tFG/scene.splinecode"
                />

                {/* Floating Navigation */}
                <nav className="absolute top-0 left-0 right-0 z-50 flex items-center justify-between p-6 md:px-12 md:py-8 pointer-events-none">
                    <Link href="/" className="flex items-center gap-2 pointer-events-auto">
                        <Image
                            src="/logo.png"
                            alt="DeXMart"
                            width={40}
                            height={40}
                            className="h-15 w-15 drop-shadow-md"
                            priority
                        />
                    </Link>

                    <div className="flex items-center gap-4 md:gap-6 pointer-events-auto">
                        <Link href="/faq" className="hidden text-sm font-medium text-foreground/80 hover:text-primary-400 transition-colors md:block drop-shadow-sm">
                            FAQs
                        </Link>
                        <Link href="/login" className="hidden text-sm font-medium text-foreground/80 hover:text-primary-400 transition-colors md:block drop-shadow-sm">
                            Login
                        </Link>
                        <ThemeToggle />
                        <Button className="rounded-full shadow-lg hover:shadow-primary-500/25 transition-shadow hidden md:inline-flex" asChild>
                            <Link href="/register">Get Started</Link>
                        </Button>
                    </div>
                </nav>
            </section>

            {/* Continuous Marquee */}
            <TrustMarquee />

            {/* Premium Bento Grid Features */}
            <BentoFeatures />

            {/* Social Proof */}
            <SocialProof />

            {/* Context-Aware Sticky Navigation Bar */}
            <motion.div
                initial={{ y: -100, opacity: 0 }}
                animate={showStickyCTA ? { y: 0, opacity: 1 } : { y: -100, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 200, damping: 20 }}
                className="fixed top-4 left-1/2 z-50 -translate-x-1/2 transform pointer-events-none w-[90%] max-w-4xl"
            >
                <div className="pointer-events-auto flex items-center justify-between rounded-full border border-white/10 bg-background/80 px-6 py-3 shadow-2xl backdrop-blur-xl dark:bg-black/60">
                    <Link href="/" className="flex items-center gap-3">
                        <Image src="/logo.png" alt="DeXMart" width={32} height={32} className="h-8 w-8" />
                        <span className="hidden font-bold tracking-tight text-foreground sm:inline-block">DeXMart</span>
                    </Link>

                    <div className="flex items-center gap-4">
                        <Link href="/faq" className="hidden text-sm font-medium text-muted-foreground hover:text-foreground md:block transition-colors">
                            FAQs
                        </Link>
                        <Link href="/login" className="hidden text-sm font-medium text-muted-foreground hover:text-foreground md:block transition-colors">
                            Login
                        </Link>
                        <div className="h-4 w-px bg-border hidden md:block" />
                        <ThemeToggle />
                        <Button className="rounded-full px-6 shadow-lg group" asChild>
                            <Link href="/register">
                                {/* Dynamic Text based on user's instruction to be 'Get Started' but allowing room for morphing later */}
                                <span>Get Started</span>
                                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                            </Link>
                        </Button>
                    </div>
                </div>
            </motion.div>

            {/* Footer */}
            <footer className="border-t border-border bg-background px-4 py-8 relative z-10">
                <div className="mx-auto flex max-w-6xl items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                        © 2026 DeXMart. All rights reserved.
                    </p>
                    <div className="flex gap-4">
                        <Link href="/pricing" className="text-sm text-muted-foreground transition-colors hover:text-foreground">Pricing</Link>
                        <Link href="/privacy" className="text-sm text-muted-foreground transition-colors hover:text-foreground">Privacy</Link>
                        <Link href="/terms" className="text-sm text-muted-foreground transition-colors hover:text-foreground">Terms</Link>
                    </div>
                </div>
            </footer>
        </div>
    );
}
