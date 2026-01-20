"use client";

import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { AnimatedAuthHero } from "./AnimatedAuthHero";
import { Particle } from "../utils";
import { cn } from "@/lib/utils";

interface AuthTransitionLayoutProps {
    children: React.ReactNode;
    particles: Particle[];
}

export function AuthTransitionLayout({ children, particles }: AuthTransitionLayoutProps) {
    const pathname = usePathname();
    const isRegister = pathname === "/register";

    return (
        <div className="relative flex min-h-screen w-full overflow-hidden bg-background">
            {/* Animated Hero Background */}
            {/* It behaves as a right panel on Login, and full background on Register */}
            <motion.div
                layout
                className={cn(
                    "absolute top-0 bottom-0 z-0 transition-all duration-700 ease-[cubic-bezier(0.25,0.1,0.25,1.0)]",
                    isRegister
                        ? "left-0 right-0 w-full"
                        : "right-0 w-0 lg:w-1/2 left-auto" // On mobile login, width 0. On desktop, 1/2.
                )}
                initial={false}
            >
                <AnimatedAuthHero hideContent={isRegister} particles={particles} />
            </motion.div>

            {/* Form Container */}
            <motion.div
                layout
                className={cn(
                    "relative z-10 flex flex-col justify-center transition-all duration-700 ease-[cubic-bezier(0.25,0.1,0.25,1.0)] min-h-screen",
                    isRegister
                        ? "w-full items-center px-4"
                        : "w-full lg:w-1/2 items-center lg:items-center px-4"
                )}
            >
                <div className={cn(
                    "w-full transition-all duration-500",
                    isRegister ? "max-w-lg" : "max-w-sm lg:w-96"
                )}>
                    {/* Add Card styling wrapper for Register only */}
                    {isRegister ? (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.4, delay: 0.2 }}
                            className="rounded-2xl bg-white/90 p-8 shadow-2xl backdrop-blur-sm sm:p-10 dark:bg-card/90"
                        >
                            {children}
                        </motion.div>
                    ) : (
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.4 }}
                        >
                            {children}
                        </motion.div>
                    )}
                </div>
            </motion.div>
        </div>
    );
}
