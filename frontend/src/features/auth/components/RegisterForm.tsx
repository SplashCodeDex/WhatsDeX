'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import { Button, Input, PasswordInput, Checkbox } from '@/components/ui';
import { StaggeredEnter, StaggeredItem } from '@/components/ui/motion';
import { GoogleIcon } from '@/components/ui/icons';
import {
    signUp,
    registerSchema,
    type RegisterInput,
    getAuthErrorMessage,
    useAuthStore,
} from '@/features/auth';

export function RegisterForm() {
    const router = useRouter();
    const { setLoading, isLoading } = useAuthStore();

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm({
        resolver: zodResolver(registerSchema),
        defaultValues: {
            firstName: '',
            lastName: '',
            email: '',
            password: '',
            acceptTerms: false,
        },
    });

    async function onSubmit(data: any) {
        setLoading(true);
        const formData = new FormData();
        formData.append('firstName', data.firstName);
        formData.append('lastName', data.lastName);
        formData.append('email', data.email);
        formData.append('password', data.password);
        formData.append('acceptTerms', String(data.acceptTerms));

        const result = await signUp(formData);

        if (result.success) {
            toast.success('Account created successfully!', {
                description: 'Welcome to WhatsDeX! Redirecting...',
            });
            import('@/lib/confetti').then((mod) => mod.triggerSuccessBurst());
            router.push('/dashboard');
        } else {
            const mappedError = getAuthErrorMessage(result.error.code);
            const errorMessage = result.error.message || mappedError;

            toast.error('Registration failed', {
                description: errorMessage,
            });
            setLoading(false);
        }
    }

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
                                <Input
                                    id="firstName"
                                    placeholder="John"
                                    type="text"
                                    autoCapitalize="words"
                                    autoComplete="given-name"
                                    disabled={isLoading}
                                    error={!!errors.firstName}
                                    {...register('firstName')}
                                />
                                {errors.firstName && (
                                    <span className="text-xs text-destructive">{errors.firstName.message}</span>
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
                                    placeholder="Doe"
                                    type="text"
                                    autoCapitalize="words"
                                    autoComplete="family-name"
                                    disabled={isLoading}
                                    error={!!errors.lastName}
                                    {...register('lastName')}
                                />
                                {errors.lastName && (
                                    <span className="text-xs text-destructive">{errors.lastName.message}</span>
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
                                placeholder="name@example.com"
                                type="email"
                                autoCapitalize="none"
                                autoComplete="email"
                                autoCorrect="off"
                                disabled={isLoading}
                                error={!!errors.email}
                                {...register('email')}
                            />
                            {errors.email && (
                                <span className="text-xs text-destructive">{errors.email.message}</span>
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
                                autoComplete="new-password"
                                disabled={isLoading}
                                error={!!errors.password}
                                {...register('password')}
                            />
                            {errors.password && (
                                <span className="text-xs text-destructive">{errors.password.message}</span>
                            )}
                        </div>

                        <div className="grid gap-2">
                            <Checkbox
                                id="acceptTerms"
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
                                disabled={isLoading}
                                error={!!errors.acceptTerms}
                                {...register('acceptTerms')}
                            />
                            {errors.acceptTerms && (
                                <span className="text-xs text-destructive">{errors.acceptTerms.message}</span>
                            )}
                        </div>

                        <Button disabled={isLoading} className="w-full">
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
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

                <Button variant="outline" type="button" disabled={isLoading} className="w-full">
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
