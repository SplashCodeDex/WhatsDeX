'use client';

import { useActionState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import { Button, Input, PasswordInput, Checkbox } from '@/components/ui';
import { StaggeredEnter, StaggeredItem } from '@/components/ui/motion';
import { GoogleIcon } from '@/components/ui/icons';
import { signUp } from '../actions';

export function RegisterForm() {
    const router = useRouter();
    const [state, formAction, isPending] = useActionState(signUp, null);
    const fields = state?.success === false ? state.error.details?.fields as any : null;

    useEffect(() => {
        if (state?.success) {
            toast.success('Account created successfully!', {
                description: 'Welcome to WhatsDeX! Redirecting...',
            });
            import('@/lib/confetti').then((mod) => mod.triggerSuccessBurst());
            router.push('/dashboard');
        } else if (state?.success === false && state?.error) {
            // Display generic errors via toast if not field-specific
            if (!state.error.details?.field) {
                toast.error('Registration failed', {
                    description: state.error.message,
                });
            }
        }
    }, [state, router]);

    return (
        <StaggeredEnter className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
            <StaggeredItem className="flex flex-col space-y-2 text-center">
                <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary-600 to-primary-400 bg-clip-text text-transparent">
                    Create an account
                </h1>
                <p className="text-sm text-muted-foreground">
                    Enter your email below to create your account
                </p>
            </StaggeredItem>

            <StaggeredItem className="grid gap-6">
                <form action={formAction}>
                    <div className="grid gap-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <label
                                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                    htmlFor="firstName"
                                >
                                    First Name
                                </label>
                                <Input
                                    id="firstName"
                                    name="firstName"
                                    placeholder="John"
                                    type="text"
                                    autoCapitalize="words"
                                    autoComplete="given-name"
                                    disabled={isPending}
                                    defaultValue={fields?.firstName || ''}
                                />
                                {state?.success === false && state.error.details?.field === 'firstName' && (
                                    <span className="text-xs text-destructive">{state.error.message}</span>
                                )}
                            </div>
                            <div className="grid gap-2">
                                <label
                                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                    htmlFor="lastName"
                                >
                                    Last Name
                                </label>
                                <Input
                                    id="lastName"
                                    name="lastName"
                                    placeholder="Doe"
                                    type="text"
                                    autoCapitalize="words"
                                    autoComplete="family-name"
                                    disabled={isPending}
                                    defaultValue={fields?.lastName || ''}
                                />
                                {state?.success === false && state.error.details?.field === 'lastName' && (
                                    <span className="text-xs text-destructive">{state.error.message}</span>
                                )}
                            </div>
                        </div>

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
                                disabled={isPending}
                                defaultValue={fields?.email || ''}
                            />
                            {state?.success === false && state.error.details?.field === 'email' && (
                                <span className="text-xs text-destructive">{state.error.message}</span>
                            )}
                        </div>

                        <div className="grid gap-2">
                            <label
                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                htmlFor="password"
                            >
                                Password
                            </label>
                            <PasswordInput
                                id="password"
                                name="password"
                                autoComplete="new-password"
                                disabled={isPending}
                            />
                            {state?.success === false && state.error.details?.field === 'password' && (
                                <span className="text-xs text-destructive">{state.error.message}</span>
                            )}
                        </div>

                        <div className="grid gap-2">
                            <Checkbox
                                id="acceptTerms"
                                name="acceptTerms"
                                defaultChecked={fields?.acceptTerms || false}
                                label={
                                    <span>
                                        I agree to the{' '}
                                        <Link
                                            href="/terms"
                                            className="underline underline-offset-4 hover:text-primary transition-colors"
                                        >
                                            Terms of Service
                                        </Link>{' '}
                                        and{' '}
                                        <Link
                                            href="/privacy"
                                            className="underline underline-offset-4 hover:text-primary transition-colors"
                                        >
                                            Privacy Policy
                                        </Link>
                                    </span>
                                }
                                disabled={isPending}
                            />
                            {state?.success === false && state.error.details?.field === 'acceptTerms' && (
                                <span className="text-xs text-destructive">{state.error.message}</span>
                            )}
                        </div>

                        <Button disabled={isPending} className="w-full">
                            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Create Account
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

                <Button variant="outline" type="button" disabled={isPending} className="w-full">
                    <GoogleIcon className="mr-2 h-4 w-4" />
                    Google
                </Button>
            </StaggeredItem>

            <StaggeredItem className="px-8 text-center text-sm text-muted-foreground">
                <Link
                    href="/login"
                    className="underline underline-offset-4 hover:text-primary decoration-primary-500/30 transition-all font-medium"
                >
                    Already have an account? Sign In
                </Link>
            </StaggeredItem>
        </StaggeredEnter>
    );
}
