'use client';

/**
 * useAuth Hook (Refactored for SSR Safety & React 19)
 * 
 * STRICT: No direct 'window' or 'document' access during render.
 * Redirection logic is deferred to useEffect.
 */

import { useEffect, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';

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
    const pathname = usePathname();

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
            }
        } catch (err) {
            setUser(null);
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
        if (!user && !isLoading) {
            verifySession();
        }
    }, [verifySession, user, isLoading]);

    // Redirection Logic (SSR Safe)
    useEffect(() => {
        // Only redirect once loading is finished and we've confirmed null user
        if (!isLoading && !user) {
            const isAuthPage = pathname === ROUTES.LOGIN || pathname === ROUTES.REGISTER;
            if (!isAuthPage) {
                router.push(ROUTES.LOGIN);
            }
        }
    }, [user, isLoading, pathname, router]);

    // Background refresh timer
    useEffect(() => {
        if (isAuthenticated && user) {
            const REFRESH_INTERVAL = 45 * 60 * 1000;
            const timer = setInterval(() => {
                refreshSession();
            }, REFRESH_INTERVAL);

            return () => clearInterval(timer);
        }
        return undefined;
    }, [isAuthenticated, user, refreshSession]);

    const signOut = useCallback(async (): Promise<void> => {
        try {
            await fetch('/api/auth/logout', { method: 'POST' });
            setUser(null);
            router.push(ROUTES.LOGIN);
            router.refresh(); 
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
