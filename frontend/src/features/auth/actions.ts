'use server';

/**
 * Auth Server Actions
 *
 * Server-side authentication operations using Firebase Admin SDK.
 * These are called from client components via Server Actions.
 */

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

import { ROUTES } from '@/lib/constants';

import {
    loginSchema,
    registerSchema,
    forgotPasswordSchema,
} from './schemas';
import type { AuthResult, AuthUser } from './types';

// Session cookie configuration (Must match backend expectation)
const SESSION_COOKIE_NAME = 'token';
const SESSION_MAX_AGE = 60 * 60 * 24 * 14; // 14 days

/**
 * Sign in with email and password
 */
export async function signIn(
    formData: FormData
): Promise<AuthResult<AuthUser>> {
    // Parse and validate input
    const rawData = {
        email: formData.get('email'),
        password: formData.get('password'),
        rememberMe: formData.get('rememberMe') === 'on',
    };

    const parsed = loginSchema.safeParse(rawData);

    if (!parsed.success) {
        const firstIssue = parsed.error.issues[0];
        return {
            success: false,
            error: {
                code: 'validation_error',
                message: firstIssue?.message ?? 'Invalid input',
                field: firstIssue?.path[0] as string,
            },
        };
    }

    const { email, password } = parsed.data;

    try {
        // Authenticate with Backend API
        const response = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/api/auth/login`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            }
        );

        if (!response.ok) {
            const errorData = await response.json();
            return {
                success: false,
                error: {
                    code: errorData.code ?? 'auth_error',
                    message: errorData.message ?? errorData.error ?? 'Authentication failed',
                },
            };
        }

        const { user, token } = await response.json();

        // Set session cookie
        const cookieStore = await cookies();
        cookieStore.set(SESSION_COOKIE_NAME, token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: SESSION_MAX_AGE,
            path: '/',
        });

        return {
            success: true,
            data: user as AuthUser,
            message: 'Signed in successfully',
        };
    } catch (err) {
        console.error('Sign in error:', err);
        return {
            success: false,
            error: {
                code: 'network_error',
                message: 'Unable to connect. Please try again.',
            },
        };
    }
}

/**
 * Register a new account
 */
export async function signUp(
    formData: FormData
): Promise<AuthResult<AuthUser>> {
    // Parse and validate input
    const rawData = {
        firstName: formData.get('firstName'),
        lastName: formData.get('lastName'),
        email: formData.get('email'),
        password: formData.get('password'),
        tenantName: formData.get('tenantName') || undefined,
        subdomain: formData.get('subdomain') || undefined,
        acceptTerms: formData.get('acceptTerms') === 'on',
    };

    const parsed = registerSchema.safeParse(rawData);

    if (!parsed.success) {
        const firstIssue = parsed.error.issues[0];
        return {
            success: false,
            error: {
                code: 'validation_error',
                message: firstIssue?.message ?? 'Invalid input',
                field: firstIssue?.path[0] as string,
            },
        };
    }

    const { firstName, lastName, email, password, tenantName, subdomain } =
        parsed.data;

    try {
        // Register with Backend API
        const response = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/api/auth/register`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    displayName: `${firstName} ${lastName}`,
                    email,
                    password,
                    tenantName,
                    subdomain,
                }),
            }
        );

        if (!response.ok) {
            const errorData = await response.json();
            return {
                success: false,
                error: {
                    code: errorData.code ?? 'auth_error',
                    message: errorData.message ?? errorData.error ?? 'Registration failed',
                },
            };
        }

        const { user, token } = await response.json();

        // Set session cookie
        const cookieStore = await cookies();
        cookieStore.set(SESSION_COOKIE_NAME, token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: SESSION_MAX_AGE,
            path: '/',
        });

        return {
            success: true,
            data: user as AuthUser,
            message: 'Account created successfully',
        };
    } catch (err: any) {
        console.error('Sign up error:', err);
        const targetUrl = `${process.env.NEXT_PUBLIC_API_URL}/api/auth/register`;
        return {
            success: false,
            error: {
                code: 'network_error',
                message: `Connection failed to ${targetUrl}. Error: ${err.message}`,
            },
        };
    }
}

/**
 * Sign out and clear session
 */
export async function signOut(): Promise<void> {
    const cookieStore = await cookies();
    cookieStore.delete(SESSION_COOKIE_NAME);
    redirect(ROUTES.LOGIN);
}

/**
 * Request password reset email
 */
export async function requestPasswordReset(
    formData: FormData
): Promise<AuthResult> {
    const rawData = {
        email: formData.get('email'),
    };

    const parsed = forgotPasswordSchema.safeParse(rawData);

    if (!parsed.success) {
        const firstIssue = parsed.error.issues[0];
        return {
            success: false,
            error: {
                code: 'validation_error',
                message: firstIssue?.message ?? 'Invalid email',
            },
        };
    }

    try {
        await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/api/auth/forgot-password`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: parsed.data.email }),
            }
        );

        // Always return success to prevent email enumeration
        return {
            success: true,
            data: undefined,
            message: 'If an account exists, a password reset email has been sent',
        };
    } catch (err) {
        console.error('Password reset error:', err);
        return {
            success: true,
            data: undefined,
            message: 'If an account exists, a password reset email has been sent',
        };
    }
}

/**
 * Get current session from cookie
 */
export async function getSession(): Promise<AuthUser | null> {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME);

    if (!sessionCookie?.value) {
        return null;
    }

    try {
        // Verify session with Backend API
        const response = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/api/auth/me`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${sessionCookie.value}`,
                },
            }
        );

        if (!response.ok) {
            return null;
        }

        const { user } = await response.json();
        return user as AuthUser;
    } catch {
        return null;
    }
}
