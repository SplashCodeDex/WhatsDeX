'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';

export interface CheckboxProps
    extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    onCheckedChange?: (checked: boolean) => void;
}

/**
 * Custom Checkbox component
 * Fully theme-aware and accessible, replaces native checkbox
 */
const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
    ({ className, label, onCheckedChange, onChange, ...props }, ref) => {
        const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
            onCheckedChange?.(e.target.checked);
            onChange?.(e);
        };

        return (
            <label className="group flex cursor-pointer items-center space-x-2">
                <div className="relative flex items-center">
                    <input
                        type="checkbox"
                        className="peer sr-only"
                        ref={ref}
                        onChange={handleChange}
                        {...props}
                    />
                    <div
                        className={cn(
                            "box-border h-4 w-4 rounded-sm border border-primary text-primary-foreground shadow focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
                            "peer-checked:bg-gradient-to-r peer-checked:from-primary-600 peer-checked:to-primary-500 peer-checked:border-primary-600",
                            "transition-all duration-200 ease-in-out",
                            "flex items-center justify-center", // Center the icon
                            className
                        )}
                    >
                        <Check className="h-3 w-3 opacity-0 transition-opacity duration-200 peer-checked:opacity-100" />
                    </div>
                </div>
                {label && (
                    <span className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                        {label}
                    </span>
                )}
            </label>
        );
    }
);
Checkbox.displayName = 'Checkbox';

export { Checkbox };
