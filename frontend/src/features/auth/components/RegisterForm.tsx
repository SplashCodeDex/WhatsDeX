'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { GoogleIcon } from '@/components/ui/icons';
import { signUp, getAuthErrorMessage, registerSchema, RegisterInput } from '@/features/auth';

export function RegisterForm() {
    const router = useRouter();
    const [serverError, setServerError] = useState<string | null>(null);

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm<RegisterInput>({
        resolver: zodResolver(registerSchema),
    });

    async function onSubmit(data: RegisterInput) {
        setServerError(null);

        // Convert data object to FormData
        const formData = new FormData();
        Object.entries(data).forEach(([key, value]) => {
            formData.append(key, String(value));
        });

        const result = await signUp(formData);

        if (result.success) {
            import('@/lib/confetti').then((mod) => mod.triggerSuccessBurst());
            router.push('/dashboard');
        } else {
            setServerError(
                result.error.message || getAuthErrorMessage(result.error.code)
            );
        }
    }

    return (
        <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
            <div className="flex flex-col space-y-2 text-center">
                <h1 className="text-2xl font-semibold tracking-tight">Create an account</h1>
                <p className="text-sm text-muted-foreground">
                    Enter your details below to create your account
                </p>
            </div>

            <div className="grid gap-6">
                <form onSubmit={handleSubmit(onSubmit)}>
                    <div className="grid gap-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <label
                                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                    htmlFor="firstName"
                                >
                                    First Name
                                </label>
                                <input
                                    {...register('firstName')}
                                    id="firstName"
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                    placeholder="John"
                                    autoCapitalize="words"
                                    autoComplete="given-name"
                                    disabled={isSubmitting}
                                />
                                {errors.firstName && (
                                    <p className="text-xs text-destructive">
                                        {errors.firstName.message}
                                    </p>
                                )}
                            </div>
                            <div className="grid gap-2">
                                <label
                                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                    htmlFor="lastName"
                                >
                                    Last Name
                                </label>
                                <input
                                    {...register('lastName')}
                                    id="lastName"
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                    placeholder="Doe"
                                    autoCapitalize="words"
                                    autoComplete="family-name"
                                    disabled={isSubmitting}
                                />
                                {errors.lastName && (
                                    <p className="text-xs text-destructive">
                                        {errors.lastName.message}
                                    </p>
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
                            <input
                                {...register('email')}
                                id="email"
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                placeholder="name@example.com"
                                type="email"
                                autoCapitalize="none"
                                autoComplete="email"
                                autoCorrect="off"
                                disabled={isSubmitting}
                            />
                            {errors.email && (
                                <p className="text-xs text-destructive">
                                    {errors.email.message}
                                </p>
                            )}
                        </div>

                        <div className="grid gap-2">
                            <label
                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                htmlFor="password"
                            >
                                Password
                            </label>
                            <input
                                {...register('password')}
                                id="password"
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                type="password"
                                autoComplete="new-password"
                                disabled={isSubmitting}
                            />
                            {errors.password && (
                                <p className="text-xs text-destructive">
                                    {errors.password.message}
                                </p>
                            )}
                        </div>

                        <div className="grid gap-2">
                            <div className="flex items-center space-x-2">
                                <input
                                    {...register('acceptTerms')}
                                    type="checkbox"
                                    id="acceptTerms"
                                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                                    disabled={isSubmitting}
                                />
                                <label
                                    htmlFor="acceptTerms"
                                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                >
                                    I agree to the{' '}
                                    <Link
                                        href="/terms"
                                        className="underline underline-offset-4 hover:text-primary"
                                    >
                                        Terms of Service
                                    </Link>{' '}
                                    and{' '}
                                    <Link
                                        href="/privacy"
                                        className="underline underline-offset-4 hover:text-primary"
                                    >
                                        Privacy Policy
                                    </Link>
                                </label>
                            </div>
                            {errors.acceptTerms && (
                                <p className="text-xs text-destructive">
                                    {errors.acceptTerms.message}
                                </p>
                            )}
                        </div>


                        {serverError && (
                            <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
                                {serverError}
                            </div>
                        )}

                        <Button disabled={isSubmitting}>
                            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
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

                <Button variant="outline" type="button" disabled={isSubmitting}>
                    <GoogleIcon className="mr-2 h-4 w-4" />
                    Google
                </Button>
            </div>

            <p className="px-8 text-center text-sm text-muted-foreground">
                <Link
                    href="/login"
                    className="underline underline-offset-4 hover:text-primary"
                >
                    Already have an account? Sign In
                </Link>
            </p>
        </div>
    );
}
