'use client';

import * as React from 'react';
import { Eye, EyeOff, ArrowBigUpDash, Check, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import { Input, type InputProps } from './input';
import { cn } from '@/lib/utils';

interface PasswordStrength {
    score: number; // 0 to 4
    label: string;
    description: string;
    color: string;
}

const getStrength = (password: string): PasswordStrength => {
    let score = 0;
    if (!password) return { score: 0, label: '', description: '', color: 'bg-muted' };

    if (password.length > 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;

    const strengths: PasswordStrength[] = [
        { score: 0, label: 'Very Weak', description: 'Try adding numbers or symbols.', color: 'bg-destructive' },
        { score: 1, label: 'Weak', description: 'Getting there. Add some variety.', color: 'bg-orange-500' },
        { score: 2, label: 'Medium', description: 'Good, but could be stronger.', color: 'bg-yellow-500' },
        { score: 3, label: 'Strong', description: 'Solid password!', color: 'bg-emerald-500' },
        { score: 4, label: 'Mastermind', description: 'Unbreakable. Excellent!', color: 'bg-primary-500' },
    ];

    return (strengths[score] || strengths[0])!;
};

/**
 * PasswordInput component
 * Enhanced with visibility toggle, Caps Lock detection, and strength meter.
 * Follows 2026 design standards with GPU-accelerated micro-animations.
 */
const PasswordInput = React.forwardRef<HTMLInputElement, InputProps>(
    ({ className, onChange, value, ...props }, ref) => {
        const [showPassword, setShowPassword] = React.useState(false);
        const [isCapsLockOn, setIsCapsLockOn] = React.useState(false);
        const [internalValue, setInternalValue] = React.useState('');

        const toggleVisibility = (e: React.MouseEvent) => {
            e.preventDefault();
            setShowPassword((prev) => !prev);
        };

        const handleKeyUp = (e: React.KeyboardEvent<HTMLInputElement>) => {
            setIsCapsLockOn(e.getModifierState('CapsLock'));
        };

        const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
            setInternalValue(e.target.value);
            if (onChange) onChange(e);
        };

        const strength = getStrength(internalValue);
        const displayValue = value !== undefined ? (value as string) : internalValue;
        const currentStrength = getStrength(displayValue);

        return (
            <div className="flex flex-col space-y-2 group w-full">
                <div className="relative">
                    <Input
                        type={showPassword ? 'text' : 'password'}
                        className={cn('pr-12', className)}
                        ref={ref}
                        onChange={handleChange}
                        onKeyUp={handleKeyUp}
                        value={value}
                        {...props}
                    />

                    <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center space-x-1">
                        {/* Caps Lock Indicator */}
                        <AnimatePresence>
                            {isCapsLockOn && (
                                <motion.div
                                    initial={{ opacity: 0, x: 10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 10 }}
                                    className="text-amber-500 pointer-events-none"
                                    title="Caps Lock is ON"
                                >
                                    <ArrowBigUpDash className="h-4 w-4" />
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Visibility Toggle */}
                        <button
                            type="button"
                            onClick={toggleVisibility}
                            className="p-1 rounded-md text-muted-foreground hover:text-primary transition-all duration-200 focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                            aria-label={showPassword ? 'Hide password' : 'Show password'}
                            tabIndex={-1}
                        >
                            <AnimatePresence mode="wait" initial={false}>
                                <motion.div
                                    key={showPassword ? 'eye-off' : 'eye'}
                                    initial={{ opacity: 0, scale: 0.8, rotate: -45 }}
                                    animate={{ opacity: 1, scale: 1, rotate: 0 }}
                                    exit={{ opacity: 0, scale: 0.8, rotate: 45 }}
                                    transition={{ type: 'spring', damping: 20, stiffness: 300 }}
                                    className="flex items-center justify-center"
                                >
                                    {showPassword ? (
                                        <EyeOff className="h-4 w-4" />
                                    ) : (
                                        <Eye className="h-4 w-4" />
                                    )}
                                </motion.div>
                            </AnimatePresence>
                        </button>
                    </div>
                </div>

                {/* Password Strength Meter */}
                <AnimatePresence>
                    {displayValue.length > 0 && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="space-y-1.5"
                        >
                            <div className="flex justify-between items-center px-0.5">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                                    Strength: <span className={cn("transition-colors duration-300", currentStrength.color.replace('bg-', 'text-'))}>{currentStrength.label}</span>
                                </span>
                                <span className="text-[10px] text-muted-foreground italic">
                                    {currentStrength.description}
                                </span>
                            </div>
                            <div className="h-1 w-full bg-secondary rounded-full overflow-hidden">
                                <motion.div
                                    className={cn("h-full", currentStrength.color)}
                                    initial={{ width: 0 }}
                                    animate={{ width: `${(currentStrength.score + 1) * 20}%` }}
                                    transition={{ type: 'spring', damping: 25, stiffness: 120 }}
                                />
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        );
    }
);

PasswordInput.displayName = 'PasswordInput';

export { PasswordInput };
