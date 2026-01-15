'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { useAuth, signIn, type LoginInput, getAuthErrorMessage } from '@/features/auth';

export function LoginForm() {
    const router = useRouter();
    const { user } = useAuth();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setIsLoading(true);
        setError(null);

        const formData = new FormData(event.currentTarget);
        const result = await signIn(formData);

        if (result.success) {
            router.push('/dashboard');
        } else {
            const mappedError = getAuthErrorMessage(result.error.code);
            if (mappedError === 'An unexpected error occurred' && result.error.message) {
                setError(result.error.message);
            } else {
                setError(mappedError);
            }
            setIsLoading(false);
        }
    }

    return (
        <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
            <div className="flex flex-col space-y-2 text-center">
                <h1 className="text-2xl font-semibold tracking-tight">Welcome back</h1>
                <p className="text-sm text-muted-foreground">
                    Enter your email to sign in to your account
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
                            <input
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
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
                        <div className="grid gap-2">
                            <div className="flex items-center justify-between">
                                <label
                                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                    htmlFor="password"
                                >
                                    Password
                                </label>
                                <Link
                                    href="/forgot-password"
                                    className="text-xs font-medium text-primary hover:underline"
                                >
                                    Forgot password?
                                </Link>
                            </div>
                            <input
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                id="password"
                                name="password"
                                type="password"
                                autoComplete="current-password"
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
                            Sign In
                        </Button>
                    </div>
                </form>

                <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-background px-2 text-muted-foreground">
                            Or continue with
                        </span>
                    </div>
                </div>

                <Button variant="outline" type="button" disabled={isLoading}>
                    <svg className="mr-2 h-4 w-4" aria-hidden="true" viewBox="0 0 24 24">
                        <path
                            d="M12.0003 20.4144C16.6467 20.4144 20.5471 16.6467 20.5471 12.0003C20.5471 11.4239 20.4907 10.8624 20.3831 10.3205H12.0003V13.7383H16.7903C16.5819 14.8527 15.9389 15.8071 15.0003 16.4357V18.6757H17.8787C19.5627 17.1239 20.5471 14.8091 20.5471 12.0003Z"
                            fill="currentColor"
                        />
                        <path
                            d="M12.0001 22.95C14.4032 22.95 16.4194 22.153 17.8923 20.7302L15.0141 18.4901C14.217 19.0252 13.197 19.3402 12.0001 19.3402C9.68069 19.3402 7.7176 17.7733 7.01529 15.6602H4.03975V17.9658C5.50395 20.8732 8.52041 22.95 12.0001 22.95Z"
                            fill="currentColor"
                        />
                        <path
                            d="M7.01549 15.6602C6.83785 15.1274 6.73949 14.562 6.73949 13.9804C6.73949 13.3989 6.83785 12.8335 7.01549 12.3007V9.99506H4.04015C3.44199 11.1918 3.10303 12.548 3.10303 13.9804C3.10303 15.4128 3.44199 16.769 4.04015 17.9658L7.01549 15.6602Z"
                            fill="currentColor"
                        />
                        <path
                            d="M12.0001 8.61993C13.3072 8.61993 14.4849 9.06869 15.4081 9.95111L18.0055 7.35336C16.4168 5.87274 14.4006 4.95 12.0001 4.95C8.52041 4.95 5.50395 7.02685 4.04015 9.93427L7.01549 12.2399C7.7176 10.1268 9.68069 8.61993 12.0001 8.61993Z"
                            fill="currentColor"
                        />
                    </svg>
                    Google
                </Button>
            </div>

            <p className="px-8 text-center text-sm text-muted-foreground">
                <Link
                    href="/register"
                    className="underline underline-offset-4 hover:text-primary"
                >
                    Don&apos;t have an account? Sign Up
                </Link>
            </p>
        </div>
    );
}
