'use client';

/**
 * useAuth Hook (Refactored for SSR Safety & React 19)
 *
 * STRICT: No direct 'window' or 'document' access during render.
 * Redirection logic is deferred to useEffect.
 */

import { signInWithCustomToken } from 'firebase/auth';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useCallback } from 'react';


import { useAuthStore } from '../store';
import { type AuthUser } from '../types';

import { api, API_ENDPOINTS } from '@/lib/api';
import { ROUTES } from '@/lib/constants';
import { getClientAuth } from '@/lib/firebase/client';
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
    const {
        user,
        isLoading,
        isAuthenticated,
        error,
        setUser,
        setLoading,
        setError,
        clearError,
        retryCount,
        lastFetchAttempt,
        incrementRetryCount,
        resetRetryCount,
        setLastFetchAttempt
    } = useAuthStore();
    const router = useRouter();
    const pathname = usePathname();

    const verifySession = useCallback(async () => {
        const { 
            retryCount: currentRetry, 
            lastFetchAttempt: lastAttempt,
            setLoading,
            setLastFetchAttempt,
            setUser,
            incrementRetryCount,
            resetRetryCount
        } = useAuthStore.getState();

        // Cooldown & Backoff Guard
        const now = Date.now();
        const baseDelay = 2000; // 2 seconds
        // Exponential backoff: 2s, 4s, 8s, 16s, max 30s
        const backoffDelay = Math.min(baseDelay * Math.pow(2, currentRetry), 30000);

        if (lastAttempt && now - lastAttempt < backoffDelay) {
            logger.debug(`Auth verification throttled. Waiting ${Math.ceil((backoffDelay - (now - lastAttempt)) / 1000)}s`);
            return;
        }

        setLoading(true);
        setLastFetchAttempt(now);

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
                resetRetryCount();

                // Sync login across tabs
                if (typeof window !== 'undefined') {
                    const authChannel = new BroadcastChannel('auth_sync');
                    authChannel.postMessage({ type: 'LOGIN_SUCCESS', payload: { user: userData } });
                    authChannel.close();
                }
            } else {
                setUser(null);
                incrementRetryCount();
            }
        } catch (err) {
            setUser(null);
            incrementRetryCount();
        } finally {
            setLoading(false);
        }
    }, []); // STABLE: No dependencies, uses store.getState() internally

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
        const isAuthPage = pathname === ROUTES.LOGIN || pathname === ROUTES.REGISTER;
        
        if (!user) {
            if (isAuthPage) {
                setLoading(false);
            } else {
                verifySession();
            }
        }
    }, [verifySession, user, pathname, setLoading]);

    // Redirection Logic (SSR Safe)
    useEffect(() => {
        // Only redirect once loading is finished and we've confirmed null user
        if (!isLoading && !user) {
            const isAuthPage = pathname === ROUTES.LOGIN || pathname === ROUTES.REGISTER;
            const isDashboardPage = pathname?.startsWith('/dashboard');

            if (isDashboardPage && !isAuthPage) {
                console.log('[Auth] Guest on protected dashboard route, redirecting to login');
                router.push(ROUTES.LOGIN);
            }
        }
    }, [user, isLoading, pathname, router]);

    // --- Multi-Tab Coordination (BroadcastChannel) ---
    useEffect(() => {
        if (typeof window === 'undefined') return;

        const authChannel = new BroadcastChannel('auth_sync');

        authChannel.onmessage = (event) => {
            const { type, payload } = event.data;
            logger.debug(`[Auth Sync] Received message: ${type}`);

            switch (type) {
                case 'LOGOUT':
                    getClientAuth().signOut();
                    useAuthStore.getState().reset();
                    router.push(ROUTES.LOGIN);
                    break;
                case 'LOGIN_SUCCESS':
                    if (payload?.user) {
                        setUser(payload.user);
                        const isAuthPage = pathname === ROUTES.LOGIN || pathname === ROUTES.REGISTER;
                        if (isAuthPage) {
                            router.push(ROUTES.DASHBOARD_HOME || '/dashboard/home');
                        }
                    }
                    break;
                case 'SESSION_REFRESHED':
                    // Use payload user data if provided to avoid redundant API call
                    if (payload?.user) {
                        setUser(payload.user);
                    } else {
                        verifySession();
                    }
                    break;
                case 'REFRESHING':
                    // Another tab is already refreshing
                    break;
            }
        };

        return () => authChannel.close();
    }, [setUser, router, verifySession, pathname]);

    // Background refresh timer & Activity Monitoring for Sliding Window
    useEffect(() => {
        if (!isAuthenticated || !user) return;

        const authChannel = new BroadcastChannel('auth_sync');
        // JITTER: Add 0-5 mins of randomness to prevent concurrent "Auth Storms"
        const REFRESH_INTERVAL = (45 * 60 * 1000) + (Math.random() * 5 * 60 * 1000); 
        let lastActivity = Date.now();
        let refreshTimer: NodeJS.Timeout;

        const handleActivity = () => {
            const now = Date.now();
            if (now - lastActivity > 5 * 60 * 1000) {
                lastActivity = now;
                logger.debug('User activity detected');
            }
        };

        const performRefresh = async () => {
            // Signal to other tabs that we are handling the refresh
            authChannel.postMessage({ type: 'REFRESHING' });
            
            try {
                const response = await api.post(API_ENDPOINTS.AUTH.REFRESH);
                if (response.success && (response.data as any)?.user) {
                    const userData = (response.data as any).user;
                    authChannel.postMessage({ 
                        type: 'SESSION_REFRESHED', 
                        payload: { user: userData } 
                    });
                    setUser(userData);
                } else {
                    await verifySession();
                    authChannel.postMessage({ type: 'SESSION_REFRESHED' });
                }
            } catch (err) {
                logger.error('Background refresh failed:', err);
            }
        };

        const startTimer = () => {
            if (refreshTimer) clearInterval(refreshTimer);
            refreshTimer = setInterval(() => {
                const now = Date.now();
                // Only refresh if active in the last 2 hours
                if (now - lastActivity < 2 * 60 * 60 * 1000) {
                    performRefresh();
                }
            }, REFRESH_INTERVAL);
        };

        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                logger.debug('Tab became visible, resuming auth timers');
                startTimer();
            } else {
                logger.debug('Tab hidden, pausing auth timers');
                if (refreshTimer) clearInterval(refreshTimer);
            }
        };

        window.addEventListener('mousemove', handleActivity);
        window.addEventListener('keydown', handleActivity);
        window.addEventListener('scroll', handleActivity);
        document.addEventListener('visibilitychange', handleVisibilityChange);
        
        if (document.visibilityState === 'visible') {
            startTimer();
        }

        return () => {
            if (refreshTimer) clearInterval(refreshTimer);
            authChannel.close();
            window.removeEventListener('mousemove', handleActivity);
            window.removeEventListener('keydown', handleActivity);
            window.removeEventListener('scroll', handleActivity);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, [isAuthenticated, user, verifySession, setUser]);

    const signOut = useCallback(async (): Promise<void> => {
        try {
            // 1. Sign out from Firebase Client (Critical to prevent auto re-login)
            const auth = getClientAuth();
            await auth.signOut();

            // 2. Clear server-side session
            await api.post(API_ENDPOINTS.AUTH.LOGOUT);
            
            // 3. Notify other tabs
            if (typeof window !== 'undefined') {
                const authChannel = new BroadcastChannel('auth_sync');
                authChannel.postMessage({ type: 'LOGOUT' });
                authChannel.close();
            }

            // 4. Clear local state and redirect
            useAuthStore.getState().reset();
            router.push(ROUTES.LOGIN);
            router.refresh();
        } catch (signOutError) {
            logger.error('Sign out error:', signOutError);
        }
    }, [router]);

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
