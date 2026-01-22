"use client";

import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { AnimatedAuthHero } from "./AnimatedAuthHero";
import { Particle } from "../utils";
import { cn } from "@/lib/utils";
import { StaggeredEnter, StaggeredItem } from "@/components/ui/motion";

import { useAuth } from "../hooks";

interface AuthTransitionLayoutProps {
    children: React.ReactNode;
    particles: Particle[];
}

export function AuthTransitionLayout({ children, particles }: AuthTransitionLayoutProps) {
    const pathname = usePathname();
    const isRegister = pathname === "/register";

    // Hydrate auth session on mount
    useAuth();

    return (
        <div className="relative flex min-h-screen w-full overflow-hidden bg-background perspective-[2000px]">
            {/* Animated Hero Background */}
            <motion.div
                layout
                className={cn(
                    "absolute top-0 bottom-0 z-0 transition-all duration-700 ease-[cubic-bezier(0.25,0.1,0.25,1.0)]",
                    isRegister
                        ? "left-0 right-0 w-full"
                        : "right-0 w-0 lg:w-1/2 left-auto"
                )}
                initial={false}
            >
                <AnimatedAuthHero
                    hideContent={isRegister}
                    particles={particles}
                />
            </motion.div>

            {/* Form Container */}
            <motion.div
                id="auth-form-container" // ID ensures mouse events on the form don't trigger the background parallax
                layout
                className={cn(
                    "relative z-10 flex flex-col justify-center transition-all duration-700 ease-[cubic-bezier(0.25,0.1,0.25,1.0)] min-h-screen",
                    isRegister
                        ? "w-full items-center px-4"
                        : "w-full lg:w-1/2 items-center lg:items-center px-4"
                )}
                style={{
                    transformStyle: "preserve-3d",
                }}
            >
                <div className={cn(
                    "w-full transition-all duration-500",
                    isRegister ? "max-w-lg" : "max-w-sm lg:w-96"
                )}>
                    <AnimatePresence mode="wait" initial={false}>
                        <motion.div
                            key={pathname}
                            // Clean Scale/Fade Transition - Eliminates directional jumps
                            // This provides a "Morphing" feel that works perfectly for both directions
                            initial={{ opacity: 0, scale: 0.95, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 1.05, y: -10 }}
                            transition={{ duration: 0.35, ease: "easeInOut" }}
                        >
                            <div className={cn(
                                "relative", // Needed for border glow positioning
                                isRegister && "rounded-2xl bg-white/90 p-8 shadow-2xl backdrop-blur-sm sm:p-10 dark:bg-card/90"
                            )}>
                                {/* Subtle Animated Gradient Border for Register Card */}
                                {isRegister && (
                                    <div className="absolute -inset-[1px] -z-10 rounded-2xl bg-gradient-to-r from-transparent via-primary-500/20 to-transparent opacity-50 blur-sm" />
                                )}

                                <StaggeredEnter>
                                    <StaggeredItem>
                                        {children}
                                    </StaggeredItem>
                                </StaggeredEnter>
                            </div>
                        </motion.div>
                    </AnimatePresence>
                </div>
            </motion.div>
        </div>
    );
}
