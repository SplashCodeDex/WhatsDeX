import * as React from 'react';

import { cn } from '@/lib/utils';

export interface InputProps
    extends React.InputHTMLAttributes<HTMLInputElement> {
    error?: boolean;
}

/**
 * Input component
 * Styled to match the design system with theme tokens
 */
const Input = React.forwardRef<HTMLInputElement, InputProps>(
    ({ className, type, error, ...props }, ref) => {
        return (
            <input
                type={type}
                className={cn(
                    "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:border-primary-500 focus-visible:shadow-[0_0_0_2px_rgba(var(--primary-500),0.2)] disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200",
                    error && "border-destructive focus-visible:border-destructive focus-visible:shadow-[0_0_0_2px_rgba(var(--destructive),0.2)]",
                    className
                )}
                ref={ref}
                {...props}
            />
        );
    }
);
Input.displayName = 'Input';

export { Input };
