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

    const verifySession = useCallback(async () => {
        setLoading(true);
        try {
            const response = await api.get<{ user: AuthUser }>(API_ENDPOINTS.AUTH.VERIFY);
            if (response.success && response.data) {
                const userData = (response.data as any).user || response.data;

                // Native Firebase Auth bridge
                if (userData.firebaseToken) {
                    try {
                        const auth = getClientAuth();
                        if (!auth.currentUser) {
                            await signInWithCustomToken(auth, userData.firebaseToken);
                            logger.info('Firebase Client Auth successful');
                        }
                    } catch (firebaseAuthError) {
                        logger.error('Firebase Client Auth failed:', firebaseAuthError);
                    }
                }

                setUser(userData);
            } else {
                setUser(null);
                const isAuthPage = window.location.pathname === ROUTES.LOGIN || window.location.pathname === ROUTES.SIGNUP;
                if (!isAuthPage) {
                    window.location.href = ROUTES.LOGIN;
                }
            }
        } catch (err) {
            setUser(null);
            const isAuthPage = window.location.pathname === ROUTES.LOGIN || window.location.pathname === ROUTES.SIGNUP;
            if (!isAuthPage) {
                window.location.href = ROUTES.LOGIN;
            }
        } finally {
            setLoading(false);
        }
    }, [setUser, setLoading]);

    const refreshSession = useCallback(async () => {
        try {
            logger.debug('Refreshing session token...');
            const response = await api.post(API_ENDPOINTS.AUTH.REFRESH);
            if (response.success) {
                logger.info('Session refreshed successfully');
                // Re-verify to update user state if needed
                await verifySession();
            } else {
                logger.warn('Session refresh failed:', response.error);
            }
        } catch (err) {
            logger.error('Error during silent refresh:', err);
        }
    }, [verifySession]);

    // Initial hydration
    useEffect(() => {
        if (!user) {
            verifySession();
        }
    }, [verifySession, user]);

    // Background refresh timer (runs every 45 mins since access token is 1h)
    useEffect(() => {
        if (isAuthenticated && user) {
            const REFRESH_INTERVAL = 45 * 60 * 1000;
            const timer = setInterval(() => {
                refreshSession();
            }, REFRESH_INTERVAL);

            return () => clearInterval(timer);
        }
    }, [isAuthenticated, user, refreshSession]);

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
        refreshSession
    };
}
