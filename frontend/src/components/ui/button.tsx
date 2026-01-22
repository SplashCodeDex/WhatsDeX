"use client";

import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

import { cn } from '@/lib/utils';

/**
 * Button component variants using class-variance-authority.
 * Follows atomic design principles - pure, stateless, composable.
 */
const buttonVariants = cva(
    // Base styles applied to all variants
    [
        'relative inline-flex items-center justify-center gap-2 whitespace-nowrap',
        'rounded-lg font-medium transition-all duration-200',
        'focus-visible:ring-2 focus-visible:ring-primary-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background focus:outline-none',
        'disabled:pointer-events-none disabled:opacity-50',
        'active:scale-[0.98]',
        // Icon sizing
        '[&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0',
        'overflow-hidden shadow-sm hover:shadow-md cursor-pointer group',
    ],
    {
        variants: {
            variant: {
                default: [
                    'bg-gradient-to-r from-primary-600 to-primary-500 text-white shadow-lg shadow-primary-500/20',
                    'hover:from-primary-700 hover:to-primary-600 hover:shadow-primary-500/30',
                    'dark:from-primary-500 dark:to-primary-400 dark:hover:from-primary-600 dark:hover:to-primary-500',
                ],
                destructive: [
                    'bg-gradient-to-br from-destructive to-destructive/80 text-white shadow-lg shadow-destructive/20',
                    'hover:shadow-destructive/40 hover:brightness-110 active:brightness-95',
                ],
                outline: [
                    'border border-input bg-background/50 backdrop-blur-md text-foreground',
                    'hover:bg-muted hover:border-border hover:shadow-md active:bg-muted/80',
                ],
                secondary: [
                    'bg-muted text-foreground',
                    'hover:bg-muted/80',
                ],
                ghost: [
                    'hover:bg-white/5 hover:text-foreground active:bg-white/10 transition-colors',
                ],
                link: ['text-primary-500 underline-offset-4 hover:underline'],
            },
            size: {
                default: 'h-10 px-4 py-2 text-sm',
                sm: 'h-8 rounded-md px-3 text-xs',
                lg: 'h-12 rounded-lg px-6 text-base',
                xl: 'h-14 rounded-xl px-8 text-lg',
                icon: 'h-10 w-10',
            },
        },
        defaultVariants: {
            variant: 'default',
            size: 'default',
        },
    }
);

export interface ButtonProps
    extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
    /**
     * If true, the button will render as its child element (Slot pattern).
     * Useful for composing with Link or other components.
     */
    asChild?: boolean;
    /**
     * Shows a loading spinner and disables the button.
     */
    isLoading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    (
        { className, variant, size, asChild = false, isLoading = false, children, disabled, ...props },
        ref
    ): React.JSX.Element => {
        const Comp = asChild ? Slot : motion.button;

        return (
            <Comp
                className={cn(buttonVariants({ variant, size, className }))}
                ref={ref}
                disabled={disabled || isLoading}
                {...(asChild ? props : {
                    whileHover: { scale: 1.01 },
                    whileTap: { scale: 0.98 },
                    ...props
                })}
            >
                {asChild ? (
                    children
                ) : (
                    <>
                        {/* Animated Background Pulse for primary variants on hover - Stateless via CSS */}
                        {variant === 'default' && !isLoading && (
                            <div
                                className="absolute inset-0 bg-white/20 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                            />
                        )}

                        <AnimatePresence mode="wait">
                            {isLoading ? (
                                <motion.div
                                    key="loading"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className="flex items-center gap-2"
                                >
                                    <motion.svg
                                        className="h-4 w-4"
                                        xmlns="http://www.w3.org/2000/svg"
                                        viewBox="0 0 24 24"
                                        initial={{ rotate: 0 }}
                                        animate={{ rotate: 360 }}
                                        transition={{
                                            repeat: Infinity,
                                            duration: 1,
                                            ease: 'linear',
                                        }}
                                    >
                                        <circle
                                            className="opacity-25"
                                            cx="12"
                                            cy="12"
                                            r="10"
                                            stroke="currentColor"
                                            strokeWidth="4"
                                            fill="none"
                                        />
                                        <path
                                            className="opacity-75"
                                            fill="currentColor"
                                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                        />
                                    </motion.svg>
                                    <span className="truncate">{children}</span>
                                </motion.div>
                            ) : (
                                <motion.div
                                    key="content"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="flex items-center gap-2"
                                >
                                    {children}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </>
                )}
            </Comp>
        );
    }
);

Button.displayName = 'Button';

export { Button, buttonVariants };
