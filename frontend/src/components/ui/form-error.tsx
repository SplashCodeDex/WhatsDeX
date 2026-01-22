"use client";

import { motion, AnimatePresence } from "framer-motion";
import { AlertCircle } from "lucide-react";
import * as React from "react";

import { cn } from "@/lib/utils";

interface FormErrorProps {
    message?: string | undefined;
    className?: string;
}

/**
 * FormError component - A premium, brand-aligned error message for forms.
 * Uses oklch colors and subtle animations for a premium feel.
 */
export function FormError({ message, className }: FormErrorProps) {
    return (
        <AnimatePresence mode="wait">
            {message && (
                <motion.div
                    initial={{ opacity: 0, height: 0, y: -10 }}
                    animate={{ opacity: 1, height: "auto", y: 0 }}
                    exit={{ opacity: 0, height: 0, y: -10 }}
                    transition={{
                        duration: 0.2,
                        ease: [0.4, 0, 0.2, 1]
                    }}
                    className={cn(
                        "relative overflow-hidden group",
                        "mb-4 rounded-xl border border-error/20 bg-error/10 p-4",
                        "backdrop-blur-md shadow-lg shadow-error/5",
                        className
                    )}
                >
                    {/* Glow effect on hover */}
                    <div className="absolute inset-0 bg-error/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                    <div className="relative flex items-center gap-3">
                        <div className="flex-shrink-0 rounded-full bg-error/20 p-1">
                            <AlertCircle className="h-4 w-4 text-error" />
                        </div>
                        <p className="text-sm font-medium text-error leading-tight">
                            {message}
                        </p>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}

FormError.displayName = "FormError";
