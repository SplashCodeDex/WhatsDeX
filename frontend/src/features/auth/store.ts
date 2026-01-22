'use client';

/**
 * Auth Store
 *
 * Zustand store for authentication state.
 * Used by useAuth hook and components.
 */

import { create } from 'zustand';

import type { AuthUser } from './types';

interface AuthStoreState {
    user: AuthUser | null;
    isLoading: boolean;
    isAuthenticated: boolean;
    error: string | null;
}

interface AuthStoreActions {
    setUser: (user: AuthUser | null) => void;
    setLoading: (loading: boolean) => void;
    setError: (error: string | null) => void;
    clearError: () => void;
    reset: () => void;
}

type AuthStore = AuthStoreState & AuthStoreActions;

const initialState: AuthStoreState = {
    user: null,
    isLoading: false,
    isAuthenticated: false,
    error: null,
};

export const useAuthStore = create<AuthStore>((set) => ({
    ...initialState,

    setUser: (user) =>
        set({
            user,
            isAuthenticated: user !== null,
            isLoading: false,
        }),

    setLoading: (isLoading) => set({ isLoading }),

    setError: (error) => set({ error }),

    clearError: () => set({ error: null }),

    reset: () => set(initialState),
}));
