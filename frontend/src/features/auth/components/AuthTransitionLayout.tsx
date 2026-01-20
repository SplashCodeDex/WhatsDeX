"use client";

import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
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
                id="auth-form-container" // ID for mouse exclusion
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
                            // Smoother transition: Reduced X distance, adjusted Tilt direction
                            // When going to Register (Center), enter from Right (15), exit to Left (-15)
                            // When going to Login (Left), enter from Left (-15), exit to Right (15)
                            initial={{
                                opacity: 0,
                                x: isRegister ? 15 : -15,
                                rotateY: isRegister ? 5 : -5
                            }}
                            animate={{ opacity: 1, x: 0, rotateY: 0 }}
                            exit={{
                                opacity: 0,
                                x: isRegister ? -15 : 15,
                                rotateY: isRegister ? -5 : 5
                            }}
                            transition={{ duration: 0.4, ease: "easeInOut" }}
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
