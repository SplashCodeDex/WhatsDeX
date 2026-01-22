"use client";

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

export interface InputProps
    extends React.InputHTMLAttributes<HTMLInputElement> {
    error?: boolean;
}

/**
 * Input component
 * Refactored with Framer Motion for premium glassmorphism and interactions.
 */
const Input = React.forwardRef<HTMLInputElement, InputProps>(
    ({ className, type, error, ...props }, ref) => {
        const [isFocused, setIsFocused] = React.useState(false);

        return (
            <div className="relative w-full group">
                <motion.input
                    type={type}
                    className={cn(
                        "flex h-10 w-full rounded-md border border-input bg-muted/30 px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground/60 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200 backdrop-blur-md shadow-sm hover:bg-muted/50 hover:border-border",
                        error && "border-destructive/50 text-destructive placeholder:text-destructive/40",
                        isFocused && (error ? "border-destructive shadow-[0_0_0_1px_var(--color-destructive)]" : "border-primary-500 shadow-[0_0_0_1px_var(--color-primary-500)]"),
                        className
                    )}
                    onFocus={(e: React.FocusEvent<HTMLInputElement>) => {
                        setIsFocused(true);
                        props.onFocus?.(e);
                    }}
                    onBlur={(e: React.FocusEvent<HTMLInputElement>) => {
                        setIsFocused(false);
                        props.onBlur?.(e);
                    }}
                    whileHover={{ scale: 1.005 }}
                    whileTap={{ scale: 0.995 }}
                    ref={ref}
                    {...props}
                />
            </div>
        );
    }
);
Input.displayName = 'Input';

export { Input };
