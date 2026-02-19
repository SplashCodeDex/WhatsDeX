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
        // Use a local ref for the input to ensure we can read its state reliably
        const internalRef = React.useRef<HTMLInputElement>(null);
        const combinedRef = (ref as React.MutableRefObject<HTMLInputElement>) || internalRef;

        const [isChecked, setIsChecked] = React.useState(controlledChecked !== undefined ? controlledChecked : (defaultChecked || false));

        // Sync with controlled prop or defaultChecked change (e.g. from server action state)
        React.useEffect(() => {
            if (controlledChecked !== undefined) {
                setIsChecked(controlledChecked);
            } else if (defaultChecked !== undefined) {
                setIsChecked(defaultChecked);
            }
        }, [controlledChecked, defaultChecked]);

        const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
            const newChecked = e.target.checked;
            if (controlledChecked === undefined) {
                setIsChecked(newChecked);
            }
            onCheckedChange?.(newChecked);
            onChange?.(e);
        };

        return (
            <label className="group flex cursor-pointer items-center space-x-3 select-none">
                <div className="relative flex items-center justify-center">
                    <input
                        type="checkbox"
                        className="peer sr-only"
                        ref={combinedRef}
                        checked={controlledChecked !== undefined ? controlledChecked : undefined}
                        defaultChecked={controlledChecked === undefined ? defaultChecked : undefined}
                        onChange={handleChange}
                        {...(props as any)}
                    />

                    {/* Checkbox Box with Glassmorphism */}
                    <motion.div
                        initial={false}
                        animate={{
                            scale: isChecked ? 1 : 0.95,
                            backgroundColor: isChecked
                                ? 'var(--p)' // Using standard CSS variables
                                : 'var(--m)',
                            borderColor: isChecked
                                ? 'var(--p)'
                                : error
                                    ? 'var(--er)'
                                    : 'var(--b3)',
                        }}
                        whileHover={{
                            scale: 1.05,
                            borderColor: isChecked
                                ? 'var(--p)'
                                : error
                                    ? 'var(--er)'
                                    : 'rgba(var(--bc), 0.2)'
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
                                    className="flex items-center justify-center"
                                >
                                    <svg
                                        width="12"
                                        height="12"
                                        viewBox="0 0 12 12"
                                        fill="none"
                                        xmlns="http://www.w3.org/2000/svg"
                                        className="text-white"
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
