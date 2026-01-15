'use client';

import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';

import { cn } from '@/lib/utils';

/**
 * Button component variants using class-variance-authority.
 * Follows atomic design principles - pure, stateless, composable.
 */
const buttonVariants = cva(
    // Base styles applied to all variants
    [
        'inline-flex items-center justify-center gap-2 whitespace-nowrap',
        'rounded-lg font-medium transition-all duration-150',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        'disabled:pointer-events-none disabled:opacity-50',
        // Active state for tactile feedback
        'active:scale-[0.98]',
        // Icon sizing
        '[&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0',
    ],
    {
        variants: {
            variant: {
                default: [
                    'bg-primary-600 text-white shadow-sm',
                    'hover:bg-primary-700',
                    'dark:bg-primary-500 dark:hover:bg-primary-600',
                ],
                destructive: [
                    'bg-error text-error-foreground shadow-sm',
                    'hover:bg-error/90',
                ],
                outline: [
                    'border border-input bg-background shadow-sm',
                    'hover:bg-muted hover:text-foreground',
                ],
                secondary: [
                    'bg-muted text-foreground shadow-sm',
                    'hover:bg-muted/80',
                ],
                ghost: ['hover:bg-muted hover:text-foreground'],
                link: ['text-primary-600 underline-offset-4 hover:underline'],
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

/**
 * Button component with multiple variants and sizes.
 *
 * @example
 * // Default button
 * <Button>Click me</Button>
 *
 * @example
 * // Button as Link
 * <Button asChild>
 *   <Link href="/login">Sign In</Link>
 * </Button>
 *
 * @example
 * // Loading state
 * <Button isLoading>Submitting...</Button>
 */
const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    (
        { className, variant, size, asChild = false, isLoading = false, children, disabled, ...props },
        ref
    ) => {
        const Comp = asChild ? Slot : 'button';

        return (
            <Comp
                className={cn(buttonVariants({ variant, size, className }))}
                ref={ref}
                disabled={disabled ?? isLoading}
                {...props}
            >
                {isLoading ? (
                    <>
                        <svg
                            className="animate-spin"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                        >
                            <circle
                                className="opacity-25"
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="currentColor"
                                strokeWidth="4"
                            />
                            <path
                                className="opacity-75"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            />
                        </svg>
                        {children}
                    </>
                ) : (
                    children
                )}
            </Comp>
        );
    }
);

Button.displayName = 'Button';

export { Button, buttonVariants };
