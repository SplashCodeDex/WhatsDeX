'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Loader2, ArrowLeft, MailCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import { Button, Input } from '@/components/ui';
import { requestPasswordReset, getAuthErrorMessage } from '@/features/auth';

/**
 * ForgotPasswordForm
 * Clean, modern form for password reset requests with premium feedback states.
 */
export function ForgotPasswordForm() {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isSuccess, setIsSuccess] = useState(false);

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setIsLoading(true);
        setError(null);

        const formData = new FormData(event.currentTarget);
        const result = await requestPasswordReset(formData);

        if (result.success) {
            setIsSuccess(true);
        } else {
            setError(result.error.message || getAuthErrorMessage(result.error.code));
            setIsLoading(false);
        }
    }

    return (
        <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
            <AnimatePresence mode="wait">
                {!isSuccess ? (
                    <motion.div
                        key="form"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        transition={{ duration: 0.3, ease: 'easeOut' }}
                        className="space-y-6"
                    >
                        <div className="flex flex-col space-y-2 text-center">
                            <h1 className="text-2xl font-semibold tracking-tight">Reset password</h1>
                            <p className="text-sm text-muted-foreground">
                                Enter your email and we&apos;ll send you a link to reset your password
                            </p>
                        </div>

                        <div className="grid gap-6">
                            <form onSubmit={handleSubmit}>
                                <div className="grid gap-4">
                                    <div className="grid gap-2">
                                        <label
                                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                            htmlFor="email"
                                        >
                                            Email
                                        </label>
                                        <Input
                                            id="email"
                                            name="email"
                                            placeholder="name@example.com"
                                            type="email"
                                            autoCapitalize="none"
                                            autoComplete="email"
                                            autoCorrect="off"
                                            disabled={isLoading}
                                            required
                                        />
                                    </div>

                                    {error && (
                                        <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
                                            {error}
                                        </div>
                                    )}

                                    <Button disabled={isLoading}>
                                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        Send Reset Link
                                    </Button>
                                </div>
                            </form>

                            <Link
                                href="/login"
                                className="flex items-center justify-center text-sm text-muted-foreground hover:text-primary transition-colors"
                            >
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Back to login
                            </Link>
                        </div>
                    </motion.div>
                ) : (
                    <motion.div
                        key="success"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{
                            type: 'spring',
                            damping: 20,
                            stiffness: 100,
                            duration: 0.4
                        }}
                        className="flex flex-col items-center space-y-4 text-center py-4"
                    >
                        <div className="rounded-full bg-primary/10 p-3 text-primary">
                            <MailCheck className="h-10 w-10" />
                        </div>
                        <h2 className="text-xl font-semibold">Check your email</h2>
                        <p className="text-sm text-muted-foreground">
                            We&apos;ve sent a password reset link to your email address. Please follow the link to reset your password.
                        </p>
                        <Button className="w-full" asChild variant="outline">
                            <Link href="/login">
                                Back to Login
                            </Link>
                        </Button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
