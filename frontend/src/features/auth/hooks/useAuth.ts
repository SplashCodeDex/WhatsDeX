'use client';

/**
 * useAuth Hook (Refactored for Session-based Auth)
 *
 * Persists auth state via cookie-based sessions.
 * Hydrates state from /api/auth/me on mount.
 */

import { useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

import { signInWithCustomToken } from 'firebase/auth';
import { useAuthStore } from '../store';
import { type AuthUser } from '../types';
import { api, API_ENDPOINTS } from '@/lib/api';
import { getClientAuth } from '@/lib/firebase/client';
import { ROUTES } from '@/lib/constants';
import { logger } from '@/lib/logger';

export interface UseAuthReturn {
    user: AuthUser | null;
    isLoading: boolean;
    isAuthenticated: boolean;
    error: string | null;
    signOut: () => Promise<void>;
    clearError: () => void;
    refreshSession: () => Promise<void>;
}

export function useAuth(): UseAuthReturn {
    const { user, isLoading, isAuthenticated, error, setUser, setLoading, setError, clearError } =
        useAuthStore();
    const router = useRouter();

    const fetchSession = useCallback(async () => {
        // If we already have a user, don't fetch (unless forced, but simple check first)
        // Actually, we should verify validity on mount in case cookie expired
        setLoading(true);
        try {
            const response = await api.get<{ user: AuthUser }>(API_ENDPOINTS.AUTH.VERIFY);
            if (response.success && response.data) {
                // Backend might return wrapped { user: ... } or just user object
                // authRoutes.ts -> getMe -> res.json({ user: ... })
                // So response.data is { user: ... }
                // We need to be careful about the type
                // Checking backend `authController.ts` would be ideal but from previous context it returns { user }

                // Let's assume response.data IS the user object if the API client unwraps 'data' property
                // But `getMe` usually returns { user: ... }
                // So response.data might be { user: ... }
                // Let's safe check
                const userData = (response.data as any).user || response.data;

                // Native Firebase Auth bridge
                if (userData.firebaseToken) {
                    try {
                        const auth = getClientAuth();
                        await signInWithCustomToken(auth, userData.firebaseToken);
                        logger.info('Firebase Client Auth successful');
                    } catch (firebaseAuthError) {
                        logger.error('Firebase Client Auth failed:', firebaseAuthError);
                    }
                }

                setUser(userData);
            } else {
                setUser(null);
                // Redirect on session failure only if not already on auth pages
                const isAuthPage = window.location.pathname === '/login' || window.location.pathname === '/signup';
                if (!isAuthPage) {
                    window.location.href = '/login';
                }
            }
        } catch (err) {
            // calculated failure (401 etc)
            setUser(null);
            // Redirect on session failure only if not already on auth pages
            const isAuthPage = window.location.pathname === '/login' || window.location.pathname === '/signup';
            if (!isAuthPage) {
                window.location.href = '/login';
            }
        } finally {
            setLoading(false);
        }
    }, [setUser, setLoading]);

    // Initial hydration
    useEffect(() => {
        if (!user) {
            fetchSession();
        }
    }, [fetchSession, user]); // Only fetch if no user

    const signOut = useCallback(async (): Promise<void> => {
        try {
            // Call logout endpoint to clear cookie server-side
            await fetch('/api/auth/logout', { method: 'POST' });
            // Or use server action, but we are in client hook.
            // Simplified: clear store and redirect.
            // Ideally we hit an endpoint that clears the cookie.

            setUser(null);
            router.push(ROUTES.LOGIN);
            router.refresh(); // Refresh to clear server component cache
        } catch (signOutError) {
            logger.error('Sign out error:', signOutError);
        }
    }, [setUser, router]);

    return {
        user,
        isLoading,
        isAuthenticated,
        error,
        signOut,
        clearError,
        refreshSession: fetchSession,
    };
}
