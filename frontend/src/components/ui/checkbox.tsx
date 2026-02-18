'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';

export interface CheckboxProps
    extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: React.ReactNode;
    error?: boolean;
    onCheckedChange?: (checked: boolean) => void;
}

/**
 * Premium Checkbox component
 * Features glassmorphism, Framer Motion animations, and path drawing effects.
 */
const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
    ({ className, label, error, onCheckedChange, onChange, checked: controlledChecked, defaultChecked, ...props }, ref) => {
        const [internalChecked, setInternalChecked] = React.useState(defaultChecked || false);
        const isChecked = controlledChecked !== undefined ? controlledChecked : internalChecked;

        const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
            if (controlledChecked === undefined) {
                setInternalChecked(e.target.checked);
            }
            onCheckedChange?.(e.target.checked);
            onChange?.(e);
        };

        return (
            <label className="group flex cursor-pointer items-center space-x-3 select-none">
                <div className="relative flex items-center justify-center">
                    <input
                        type="checkbox"
                        className="peer sr-only"
                        ref={ref}
                        checked={isChecked}
                        onChange={handleChange}
                        {...(props as any)}
                    />

                    {/* Checkbox Box with Glassmorphism */}
                    <motion.div
                        initial={false}
                        animate={{
                            scale: isChecked ? 1 : 0.95,
                            backgroundColor: isChecked
                                ? 'var(--color-primary)'
                                : 'var(--color-muted)',
                            borderColor: isChecked
                                ? 'var(--color-primary)'
                                : error
                                    ? 'var(--color-destructive)'
                                    : 'var(--color-border)',
                        }}
                        whileHover={{
                            scale: 1.05,
                            borderColor: isChecked
                                ? 'var(--color-primary)'
                                : error
                                    ? 'var(--color-destructive)'
                                    : 'oklch(var(--border) / 0.8)'
                        }}
                        whileTap={{ scale: 0.9 }}
                        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                        className={cn(
                            "relative flex h-5 w-5 items-center justify-center rounded-md border backdrop-blur-md transition-shadow",
                            "peer-focus-visible:ring-2 peer-focus-visible:ring-primary peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-background",
                            "disabled:cursor-not-allowed disabled:opacity-50",
                            className
                        )}
                    >
                        <AnimatePresence>
                            {isChecked && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.5 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.5 }}
                                    transition={{ duration: 0.15 }}
                                >
                                    <svg
                                        width="12"
                                        height="12"
                                        viewBox="0 0 12 12"
                                        fill="none"
                                        xmlns="http://www.w3.org/2000/svg"
                                        className="text-primary-foreground"
                                    >
                                        <motion.path
                                            d="M2 6L5 9L10 3"
                                            stroke="currentColor"
                                            strokeWidth="2.5"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            initial={{ pathLength: 0 }}
                                            animate={{ pathLength: 1 }}
                                            transition={{
                                                type: 'spring',
                                                stiffness: 300,
                                                damping: 20,
                                            }}
                                        />
                                    </svg>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>

                </div>

                {label && (
                    <span className={cn(
                        "text-sm font-medium transition-colors duration-200",
                        isChecked ? "text-foreground" : "text-muted-foreground",
                        "group-hover:text-foreground",
                        "peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    )}>
                        {label}
                    </span>
                )}
            </label>
        );
    }
);
Checkbox.displayName = 'Checkbox';

export { Checkbox };
