/**
 * AnimatedAuthHero - Animated hero section for auth pages
 *
 * Features floating chat bubbles, spinning gears, and particle effects.
 * Uses Framer Motion for GPU-accelerated animations.
 */

'use client';

import { motion } from 'framer-motion';
import { Bot, BarChart3, Rocket, Shield } from 'lucide-react';
import type { Particle } from '../utils';

// Animation durations per PROJECT_RULES
const DURATION = {
    fast: 0.15,
    normal: 0.25,
    slow: 0.4,
    float: 6,
    spin: 12,
    particle: 8,
} as const;

// Feature pills with proper icons (no emojis per PROJECT_RULES)
const FEATURE_PILLS = [
    { icon: Bot, label: 'AI Bots' },
    { icon: BarChart3, label: 'Analytics' },
    { icon: Rocket, label: 'Campaigns' },
    { icon: Shield, label: 'Secure' },
] as const;

interface AnimatedAuthHeroProps {
    hideContent?: boolean;
    particles?: Particle[];
    isTransitioning?: boolean;
}

export function AnimatedAuthHero({ hideContent = false, particles = [], isTransitioning = false }: AnimatedAuthHeroProps) {
    return (
        <div className="absolute inset-0 overflow-hidden bg-gradient-to-br from-primary-600 via-primary-700 to-accent-600">
            {/* Grid Pattern - Static */}
            <div
                className="absolute inset-0 opacity-[0.07]"
                style={{
                    backgroundImage: `
                        linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                        linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
                    `,
                    backgroundSize: '40px 40px',
                }}
            />

            {/* Flowing Data Lines */}
            <FlowingLines isWarping={isTransitioning} />

            {/* Floating Chat Bubbles */}
            <FloatingBubble
                className="left-[15%] top-[20%]"
                size="lg"
                delay={0}
            />
            <FloatingBubble
                className="right-[20%] top-[15%]"
                size="md"
                delay={1.5}
                variant="glass"
            />
            <FloatingBubble
                className="left-[25%] bottom-[30%]"
                size="sm"
                delay={0.8}
            />
            <FloatingBubble
                className="right-[15%] bottom-[25%]"
                size="md"
                delay={2.2}
                variant="dark"
            />

            {/* Spinning Gears */}
            <SpinningGear
                className="left-[10%] bottom-[20%]"
                size={60}
                direction="cw"
            />
            <SpinningGear
                className="right-[25%] top-[25%]"
                size={45}
                direction="ccw"
                delay={2}
            />
            <SpinningGear
                className="right-[10%] bottom-[40%]"
                size={35}
                direction="cw"
                delay={4}
            />

            {/* Glowing Orbs */}
            <motion.div
                className="absolute left-1/4 top-1/4 h-64 w-64 rounded-full bg-white/10 blur-3xl"
                animate={{
                    scale: [1, 1.2, 1],
                    opacity: [0.1, 0.15, 0.1],
                }}
                transition={{
                    duration: 4,
                    repeat: Infinity,
                    ease: 'easeInOut',
                }}
            />
            <motion.div
                className="absolute bottom-1/4 right-1/4 h-64 w-64 rounded-full bg-accent-400/20 blur-3xl"
                animate={{
                    scale: [1.2, 1, 1.2],
                    opacity: [0.15, 0.1, 0.15],
                }}
                transition={{
                    duration: 5,
                    repeat: Infinity,
                    ease: 'easeInOut',
                }}
            />

            {/* Animated Particles */}
            <Particles particles={particles} />

            {/* Content Overlay */}
            {!hideContent && (
                <div className="absolute inset-0 flex flex-col items-center justify-center p-12 text-white">
                    <motion.div
                        className="max-w-lg text-center"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: DURATION.slow, delay: 0.2 }}
                    >
                        {/* Badge */}
                        <motion.div
                            className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-sm backdrop-blur-sm"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.4 }}
                        >
                            <span className="h-2 w-2 animate-pulse rounded-full bg-green-400" />
                            Enterprise-Grade Platform
                        </motion.div>

                        {/* Headline */}
                        <motion.h2
                            className="mb-4 text-4xl font-bold tracking-tight"
                            animate={{
                                textShadow: [
                                    '0 0 20px rgba(255,255,255,0.2)',
                                    '0 0 40px rgba(255,255,255,0.4)',
                                    '0 0 20px rgba(255,255,255,0.2)',
                                ],
                            }}
                            transition={{ duration: 3, repeat: Infinity }}
                        >
                            Welcome to{' '}
                            <span className="bg-gradient-to-r from-white via-primary-200 to-white bg-clip-text text-transparent">
                                WhatsDeX
                            </span>
                        </motion.h2>

                        {/* Description */}
                        <p className="mb-8 text-base leading-relaxed text-white/70">
                            Transform your WhatsApp communication with AI-powered bots,
                            bulk messaging, and real-time analytics. Built for businesses
                            that demand scale, reliability, and results.
                        </p>

                        {/* Feature Pills */}
                        <div className="flex flex-wrap justify-center gap-3">
                            {FEATURE_PILLS.map((feature, i) => (
                                <motion.div
                                    key={feature.label}
                                    className="flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-sm backdrop-blur-sm"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.6 + i * 0.1 }}
                                >
                                    <feature.icon className="h-3.5 w-3.5" />
                                    <span>{feature.label}</span>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>
                </div>
            )}
        </div>
    );
}

// ============================================================================
// Sub-Components
// ============================================================================

interface FloatingBubbleProps {
    className: string;
    size: 'sm' | 'md' | 'lg';
    delay?: number;
    variant?: 'solid' | 'glass' | 'dark';
}

function FloatingBubble({
    className,
    size,
    delay = 0,
    variant = 'solid',
}: FloatingBubbleProps) {
    const sizes = {
        sm: 'w-12 h-10',
        md: 'w-16 h-14',
        lg: 'w-20 h-16',
    };

    const variants = {
        solid: 'bg-primary-400/40 border-primary-300/50',
        glass: 'bg-white/10 backdrop-blur-sm border-white/20',
        dark: 'bg-slate-800/40 border-slate-600/30',
    };

    return (
        <motion.div
            className={`absolute ${className}`}
            animate={{
                y: [-10, 10, -10],
                rotate: [-3, 3, -3],
            }}
            transition={{
                duration: DURATION.float,
                repeat: Infinity,
                ease: 'easeInOut',
                delay,
            }}
        >
            <div
                className={`${sizes[size]} ${variants[variant]} relative rounded-2xl border shadow-lg`}
            >
                {/* Bubble tail */}
                <div
                    className={`absolute -bottom-2 left-3 h-4 w-4 rotate-45 ${variants[variant]} border-b border-r`}
                />
                {/* Typing dots */}
                <div className="absolute inset-0 flex items-center justify-center gap-1">
                    {[0, 1, 2].map((i) => (
                        <motion.div
                            key={i}
                            className="h-2 w-2 rounded-full bg-white/60"
                            animate={{ opacity: [0.4, 1, 0.4] }}
                            transition={{
                                duration: 1.2,
                                repeat: Infinity,
                                delay: i * 0.2,
                            }}
                        />
                    ))}
                </div>
            </div>
        </motion.div>
    );
}

interface SpinningGearProps {
    className: string;
    size: number;
    direction: 'cw' | 'ccw';
    delay?: number;
}

function SpinningGear({ className, size, direction, delay = 0 }: SpinningGearProps) {
    const rotation = direction === 'cw' ? 360 : -360;

    return (
        <motion.div
            className={`absolute ${className}`}
            animate={{ rotate: rotation }}
            transition={{
                duration: DURATION.spin,
                repeat: Infinity,
                ease: 'linear',
                delay,
            }}
        >
            <svg
                width={size}
                height={size}
                viewBox="0 0 24 24"
                fill="none"
                className="text-white/20"
            >
                <path
                    d="M12 15a3 3 0 100-6 3 3 0 000 6z"
                    stroke="currentColor"
                    strokeWidth="1.5"
                />
                <path
                    d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"
                    stroke="currentColor"
                    strokeWidth="1.5"
                />
            </svg>
        </motion.div>
    );
}

function FlowingLines({ isWarping }: { isWarping?: boolean }) {
    return (
        <div className="absolute inset-x-0 bottom-0 h-32 overflow-hidden">
            {[0, 1, 2].map((i) => (
                <motion.div
                    key={i}
                    className="absolute bottom-0 h-px w-full bg-gradient-to-r from-transparent via-white/30 to-transparent"
                    style={{ bottom: `${i * 40 + 20}px` }}
                    animate={{ x: ['-100%', '100%'] }}
                    transition={{
                        duration: isWarping ? 0.3 : 4 + i, // WARP SPEED when transitioning
                        repeat: Infinity,
                        ease: 'linear',
                        delay: i * 0.5,
                    }}
                />
            ))}
        </div>
    );
}

function Particles({ particles }: { particles: Particle[] }) {
    // Use fixed height value to avoid SSR issues with window
    const PARTICLE_TRAVEL_DISTANCE = -800;

    return (
        <div className="absolute inset-0 overflow-hidden">
            {particles.map((p) => (
                <motion.div
                    key={p.id}
                    className="absolute rounded-full bg-white/40"
                    style={{
                        left: p.left,
                        width: p.size,
                        height: p.size,
                        bottom: -10,
                    }}
                    animate={{
                        y: [0, PARTICLE_TRAVEL_DISTANCE],
                        opacity: [0, 1, 0],
                    }}
                    transition={{
                        duration: p.duration,
                        repeat: Infinity,
                        ease: 'linear',
                        delay: p.delay,
                    }}
                />
            ))}
        </div>
    );
}
