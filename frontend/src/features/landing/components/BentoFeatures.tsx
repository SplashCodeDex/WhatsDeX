'use client';

import { motion, useScroll, useTransform, useSpring } from 'framer-motion';
import { Bot, RefreshCw, Zap, TrendingUp, Users, ShieldCheck } from 'lucide-react';
import { useRef } from 'react';

export function BentoFeatures() {
    const sectionRef = useRef<HTMLDivElement>(null);
    const { scrollYProgress } = useScroll({
        target: sectionRef,
        offset: ['start end', 'end start']
    });

    // Layered parallax effects (different speeds based on depth perception)
    const yFastRaw = useTransform(scrollYProgress, [0, 1], [100, -100]);
    const yMediumRaw = useTransform(scrollYProgress, [0, 1], [50, -50]);
    const ySlowRaw = useTransform(scrollYProgress, [0, 1], [25, -25]);

    // Apply spring physics to smooth out the parallax (fixes mobile jitter)
    const springConfig = { stiffness: 100, damping: 30, restDelta: 0.001 };
    const yFast = useSpring(yFastRaw, springConfig);
    const yMedium = useSpring(yMediumRaw, springConfig);
    const ySlow = useSpring(ySlowRaw, springConfig);

    return (
        <section ref={sectionRef} className="relative py-24 md:py-32 overflow-hidden px-4">
            {/* Background Liquid Glass Glows */}
            <div className="absolute top-0 right-1/4 -z-10 h-80 w-80 rounded-full bg-primary-500/20 blur-[120px]" />
            <div className="absolute bottom-0 left-1/4 -z-10 h-[400px] w-[400px] rounded-full bg-purple-500/15 blur-[150px]" />

            <div className="mx-auto max-w-6xl">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: '-100px' }}
                    transition={{ duration: 0.6 }}
                    className="mb-16 text-center"
                >
                    <h2 className="mb-4 text-3xl font-bold tracking-tight text-foreground sm:text-4xl md:text-5xl">
                        Everything You Need
                    </h2>
                    <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
                        Powerful features packaged in an elegant, intelligent workspace.
                    </p>
                </motion.div>

                <div className="grid auto-rows-[250px] grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {/* Tile 1: Multi-Bot Management (Large) */}
                    <motion.div
                        style={{ y: ySlow }}
                        className="group relative flex flex-col justify-between overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur-xl transition-colors hover:bg-white/10 dark:border-white/5 dark:bg-black/20 dark:hover:bg-black/40 md:col-span-2 md:row-span-2"
                    >
                        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-primary-500/30 blur-3xl transition-all group-hover:bg-primary-500/50" />
                        <Bot className="mb-4 h-12 w-12 text-primary-500 drop-shadow-md transition-transform duration-500 group-hover:scale-110 group-hover:translate-x-1" />
                        <div className="mt-auto">
                            <h3 className="mb-2 text-2xl font-bold text-foreground">Multi-Bot Management</h3>
                            <p className="text-muted-foreground text-lg leading-relaxed">
                                Connect, monitor, and scale multiple WhatsApp accounts from a single, unified command center. 
                                Seamlessly switch contexts without losing momentum.
                            </p>
                        </div>
                    </motion.div>

                    {/* Tile 2: Real-time Sync */}
                    <motion.div
                        style={{ y: yFast }}
                        className="group relative flex flex-col justify-between overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur-xl transition-colors hover:bg-white/10 dark:border-white/5 dark:bg-black/20 dark:hover:bg-black/40 lg:col-span-1 lg:row-span-1"
                    >
                        <RefreshCw className="h-8 w-8 text-blue-400 drop-shadow-md transition-transform duration-700 group-hover:rotate-180" />
                        <div className="mt-auto z-10">
                            <h3 className="mb-1 text-lg font-bold text-foreground">Real-time Sync</h3>
                            <p className="text-sm text-muted-foreground">Messages sync instantly across all devices.</p>
                        </div>
                    </motion.div>

                    {/* Tile 3: Analytics */}
                    <motion.div
                        style={{ y: yMedium }}
                        className="group relative flex flex-col justify-between overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur-xl transition-colors hover:bg-white/10 dark:border-white/5 dark:bg-black/20 dark:hover:bg-black/40 lg:col-span-1 lg:row-span-1"
                    >
                        <TrendingUp className="h-8 w-8 text-green-400 drop-shadow-md transition-transform duration-500 group-hover:-translate-y-1 group-hover:scale-110" />
                        <div className="mt-auto z-10">
                            <h3 className="mb-1 text-lg font-bold text-foreground">Analytics</h3>
                            <p className="text-sm text-muted-foreground">Detailed engagement and conversion routing.</p>
                        </div>
                    </motion.div>

                    {/* Tile 4: Automation Rules (Wide) */}
                    <motion.div
                        style={{ y: yFast }}
                        className="group relative flex flex-col overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur-xl transition-colors hover:bg-white/10 dark:border-white/5 dark:bg-black/20 dark:hover:bg-black/40 md:col-span-2 lg:row-span-1"
                    >
                        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                        <div className="flex h-full items-center gap-6">
                            <div className="flex-shrink-0 rounded-2xl bg-purple-500/20 p-4">
                                <Zap className="h-8 w-8 text-purple-400 drop-shadow-md transition-transform duration-500 group-hover:scale-125 group-hover:rotate-12" />
                            </div>
                            <div className="z-10 text-left">
                                <h3 className="mb-1 text-xl font-bold text-foreground">Smart Automation Rules</h3>
                                <p className="text-muted-foreground">Set up powerful logic to respond to complex inquiries automatically.</p>
                            </div>
                        </div>
                    </motion.div>

                    {/* Tile 5: Team Collaboration */}
                    <motion.div
                        style={{ y: yMedium }}
                        className="group relative flex flex-col justify-between overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur-xl transition-colors hover:bg-white/10 dark:border-white/5 dark:bg-black/20 dark:hover:bg-black/40 lg:col-span-1 lg:row-span-1"
                    >
                        <Users className="h-8 w-8 text-orange-400 drop-shadow-md transition-transform duration-500 group-hover:scale-110 group-hover:translate-x-1" />
                        <div className="mt-auto z-10">
                            <h3 className="mb-1 text-lg font-bold text-foreground">Collaboration</h3>
                            <p className="text-sm text-muted-foreground">Role-based access for multi-agent teams.</p>
                        </div>
                    </motion.div>

                    {/* Tile 6: Secure & Compliant */}
                    <motion.div
                        style={{ y: ySlow }}
                        className="group relative flex flex-col justify-between overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur-xl transition-colors hover:bg-white/10 dark:border-white/5 dark:bg-black/20 dark:hover:bg-black/40 lg:col-span-1 lg:row-span-1"
                    >
                        <ShieldCheck className="h-8 w-8 text-emerald-400 drop-shadow-md transition-transform duration-500 group-hover:scale-110" />
                        <div className="mt-auto z-10">
                            <h3 className="mb-1 text-lg font-bold text-foreground">Secure</h3>
                            <p className="text-sm text-muted-foreground">Enterprise-grade PII encryption.</p>
                        </div>
                    </motion.div>
                </div>
            </div>
        </section>
    );
}
