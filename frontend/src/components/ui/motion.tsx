"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface StaggeredEnterProps {
    children: React.ReactNode;
    className?: string;
    delay?: number;
    staggerDelay?: number;
}

export const StaggeredEnter = ({
    children,
    className,
    delay = 0,
    staggerDelay = 0.05,
}: StaggeredEnterProps) => {
    return (
        <motion.div
            initial="hidden"
            animate="visible"
            className={cn(className)}
            variants={{
                visible: {
                    transition: {
                        staggerChildren: staggerDelay,
                        delayChildren: delay,
                    },
                },
            }}
        >
            {children}
        </motion.div>
    );
};

export const StaggeredItem = ({
    children,
    className,
}: {
    children: React.ReactNode;
    className?: string;
}) => {
    return (
        <motion.div
            variants={{
                hidden: { opacity: 0, y: 10 },
                visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
            }}
            className={className}
        >
            {children}
        </motion.div>
    );
};
