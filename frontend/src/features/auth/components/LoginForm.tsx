'use client';

import { useActionState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import { Button, Input, PasswordInput, Checkbox } from '@/components/ui';
import { StaggeredEnter, StaggeredItem } from '@/components/ui/motion';
import { GoogleIcon } from '@/components/ui/icons';
import { signIn } from '../actions';

export function LoginForm() {
    const router = useRouter();
    const [state, formAction, isPending] = useActionState(signIn, null);
    const fields = state?.success === false ? state.error.details?.fields as any : null;

    useEffect(() => {
        if (state?.success) {
            toast.success('Successfully signed in!', {
                description: 'Redirecting to your dashboard...',
            });
            import('@/lib/confetti').then((mod) => mod.triggerSuccessBurst());
            router.push('/dashboard');
        } else if (state?.success === false && state?.error) {
             // If field error exists, it's shown inline. If not, toast.
             if (!state.error.details?.field) {
                 toast.error('Authentication failed', {
                    description: state.error.message
                 });
             }
        }
    }, [state, router]);
    
    return (
        <StaggeredEnter className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
            <StaggeredItem className="flex flex-col space-y-2 text-center">
                <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary-600 to-primary-400 bg-clip-text text-transparent">
                    Welcome back
                </h1>
                <p className="text-sm text-muted-foreground">
                    Enter your email to sign in to your account
                </p>
            </StaggeredItem>

            <StaggeredItem className="grid gap-6">
                <form action={formAction}>
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
                                disabled={isPending}
                                defaultValue={fields?.email || ''}
                            />
                            {state?.success === false && state.error.details?.field === 'email' && (
                                <span className="text-xs text-destructive">{state.error.message}</span>
                            )}
                        </div>
                        <div className="grid gap-2">
                            <div className="flex items-center justify-between">
                                <label
                                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                    htmlFor="password"
                                >
                                    Password
                                </label>
                            </div>
                            <PasswordInput
                                id="password"
                                name="password"
                                autoComplete="current-password"
                                disabled={isPending}
                                key={state ? 'reset' : 'initial'}
                            />
                             {state?.success === false && state.error.details?.field === 'password' && (
                                <span className="text-xs text-destructive">{state.error.message}</span>
                            )}
                        </div>

                        <div className="flex items-center justify-between">
                            <Checkbox
                                id="rememberMe"
                                name="rememberMe"
                                label="Remember me"
                                disabled={isPending}
                                defaultChecked={fields?.rememberMe || false}
                            />
                            <Link
                                href="/forgot-password"
                                className="text-xs font-medium text-primary hover:underline hover:text-primary-600 transition-colors"
                            >
                                Forgot password?
                            </Link>
                        </div>
                        
                        {state?.success === false && !state.error.details?.field && (
                            <div className="text-sm text-destructive text-center">
                                {state.error.message}
                            </div>
                        )}

                        <Button disabled={isPending} className="w-full">
                            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
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

                <Button variant="outline" type="button" disabled={isPending} className="w-full">
                    <GoogleIcon className="mr-2 h-4 w-4" />
                    Google
                </Button>
            </StaggeredItem>

            <StaggeredItem className="px-8 text-center text-sm text-muted-foreground">
                <Link
                    href="/register"
                    className="underline underline-offset-4 hover:text-primary decoration-primary-500/30 transition-all font-medium"
                >
                    Don&apos;t have an account? Sign Up
                </Link>
            </StaggeredItem>
        </StaggeredEnter>
    );
}
