'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, Zap, Globe, Lock, Cpu } from 'lucide-react';

const LOADING_STEPS = [
    {
        message: 'Establishing secure WhatsApp handshake...',
        icon: <Zap className="h-5 w-5" />,
        progress: 20,
    },
    {
        message: 'Initializing neural auth context...',
        icon: <Cpu className="h-5 w-5" />,
        progress: 45,
    },
    {
        message: 'Syncing multi-tenant session metadata...',
        icon: <Globe className="h-5 w-5" />,
        progress: 70,
    },
    {
        message: 'Verifying encrypted credentials...',
        icon: <Lock className="h-5 w-5" />,
        progress: 90,
    },
    {
        message: 'Almost there... Preparing your dashboard.',
        icon: <ShieldCheck className="h-5 w-5" />,
        progress: 100,
    },
];

/**
 * InteractiveAuthProgressBar
 * A premium loading experience with cycling "system status" messages and smooth animations.
 */
export function InteractiveAuthProgressBar() {
    const [currentStep, setCurrentStep] = useState(0);
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentStep((prev) => (prev + 1) % LOADING_STEPS.length);
        }, 2500);

        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        const targetProgress = LOADING_STEPS[currentStep]?.progress ?? progress;
        const duration = 2000;
        const start = progress;
        const startTime = performance.now();

        function animate(currentTime: number) {
            const elapsedTime = currentTime - startTime;
            if (elapsedTime < duration) {
                const nextProgress = start + (targetProgress - start) * (elapsedTime / duration);
                setProgress(nextProgress);
                requestAnimationFrame(animate);
            } else {
                setProgress(targetProgress);
            }
        }

        requestAnimationFrame(animate);
    }, [currentStep]);

    return (
        <div className="flex flex-col items-center justify-center space-y-8 p-8 max-w-md mx-auto">
            {/* Logo/Icon Animation */}
            <div className="relative h-20 w-20 flex items-center justify-center">
                <motion.div
                    className="absolute inset-0 rounded-full bg-primary/10"
                    animate={{
                        scale: [1, 1.2, 1],
                        opacity: [0.5, 0.2, 0.5],
                    }}
                    transition={{
                        duration: 3,
                        repeat: Infinity,
                        ease: 'easeInOut',
                    }}
                />
                <AnimatePresence mode="wait">
                    <motion.div
                        key={currentStep}
                        initial={{ opacity: 0, scale: 0.5, rotate: -45 }}
                        animate={{ opacity: 1, scale: 1, rotate: 0 }}
                        exit={{ opacity: 0, scale: 1.5, rotate: 45 }}
                        transition={{ duration: 0.5 }}
                        className="text-primary z-10"
                    >
                        {LOADING_STEPS[currentStep]?.icon}
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* Message & Progress Section */}
            <div className="w-full space-y-4 text-center">
                <AnimatePresence mode="wait">
                    <motion.p
                        key={currentStep}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.3 }}
                        className="text-sm font-medium text-muted-foreground h-5"
                    >
                        {LOADING_STEPS[currentStep]?.message}
                    </motion.p>
                </AnimatePresence>

                {/* Progress Bar Container */}
                <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden relative">
                    <motion.div
                        className="h-full bg-primary shadow-[0_0_10px_rgba(var(--primary-500),0.5)]"
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 0.5, ease: 'easeOut' }}
                    />

                    {/* Subtle Scan Effect */}
                    <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent w-1/3 h-full"
                        animate={{
                            x: ['-100%', '300%'],
                        }}
                        transition={{
                            duration: 1.5,
                            repeat: Infinity,
                            ease: 'linear',
                        }}
                    />
                </div>

                <div className="flex justify-between items-center text-[10px] uppercase tracking-wider text-muted-foreground/60 font-mono">
                    <span>Authenticating</span>
                    <span>{Math.round(progress)}%</span>
                </div>
            </div>

            {/* Matrix-like decorative elements */}
            <div className="flex gap-1">
                {[...Array(5)].map((_, i) => (
                    <motion.div
                        key={i}
                        className="w-1 h-1 rounded-full bg-primary/40"
                        animate={{
                            opacity: [0.2, 1, 0.2],
                        }}
                        transition={{
                            duration: 1,
                            repeat: Infinity,
                            delay: i * 0.2,
                        }}
                    />
                ))}
            </div>
        </div>
    );
}
