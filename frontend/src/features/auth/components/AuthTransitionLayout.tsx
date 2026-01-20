"use client";

import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { AnimatedAuthHero } from "./AnimatedAuthHero";
import { Particle } from "../utils";
import { cn } from "@/lib/utils";
import { StaggeredEnter, StaggeredItem } from "@/components/ui/motion";

interface AuthTransitionLayoutProps {
    children: React.ReactNode;
    particles: Particle[];
}

export function AuthTransitionLayout({ children, particles }: AuthTransitionLayoutProps) {
    const pathname = usePathname();
    const isRegister = pathname === "/register";
    const [isTransitioning, setIsTransitioning] = useState(false);

    // Trigger warp speed on route change
    useEffect(() => {
        setIsTransitioning(true);
        const timer = setTimeout(() => setIsTransitioning(false), 800);
        return () => clearTimeout(timer);
    }, [pathname]);

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
                    isTransitioning={isTransitioning}
                />
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
                style={{
                    transformStyle: "preserve-3d",
                }}
            >
                <div className={cn(
                    "w-full transition-all duration-500",
                    isRegister ? "max-w-lg" : "max-w-sm lg:w-96"
                )}>
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={pathname}
                            initial={{ opacity: 0, x: isRegister ? -30 : 30, rotateY: isRegister ? -15 : 15 }}
                            animate={{ opacity: 1, x: 0, rotateY: 0 }}
                            exit={{ opacity: 0, x: isRegister ? 30 : -30, rotateY: isRegister ? 15 : -15 }}
                            transition={{ duration: 0.5, ease: "easeOut" }}
                        >
                            <div className={cn(
                                isRegister && "rounded-2xl bg-white/90 p-8 shadow-2xl backdrop-blur-sm sm:p-10 dark:bg-card/90"
                            )}>
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
