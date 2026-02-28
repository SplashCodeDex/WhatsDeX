import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAuth } from './useAuth';
import { useAuthStore } from '../store';
import { useRouter, usePathname } from 'next/navigation';
import { api } from '@/lib/api';
import { ROUTES } from '@/lib/constants';

// Mock stores
vi.mock('../store', () => ({
    useAuthStore: vi.fn(),
}));

// Mock navigation
vi.mock('next/navigation', () => ({
    useRouter: vi.fn(),
    usePathname: vi.fn(),
}));

// Mock API
vi.mock('@/lib/api', () => ({
    api: {
        get: vi.fn(),
        post: vi.fn(),
    },
    API_ENDPOINTS: {
        AUTH: {
            VERIFY: '/api/auth/verify',
            REFRESH: '/api/auth/refresh',
        }
    }
}));

vi.mock('@/lib/firebase/client', () => ({
    getClientAuth: vi.fn(),
}));

vi.mock('@/lib/logger', () => ({
    logger: {
        info: vi.fn(),
        error: vi.fn(),
        debug: vi.fn(),
        warn: vi.fn(),
    }
}));

describe('useAuth hook', () => {
    const mockRouter = { push: vi.fn(), refresh: vi.fn() };
    const mockSetUser = vi.fn();
    const mockSetLoading = vi.fn();
    const mockUser = { id: 'user_1', email: 'test@example.com' };

    beforeEach(() => {
        vi.clearAllMocks();
        (useRouter as any).mockReturnValue(mockRouter);
        (usePathname as any).mockReturnValue('/dashboard');
        (useAuthStore as any).mockReturnValue({
            user: null,
            isLoading: false,
            isAuthenticated: false,
            setUser: mockSetUser,
            setLoading: mockSetLoading,
        });
    });

    it('should trigger verifySession on mount if no user', async () => {
        (api.get as any).mockResolvedValue({ success: true, data: mockUser });

        renderHook(() => useAuth());

        expect(mockSetLoading).toHaveBeenCalledWith(true);
        await act(async () => {
            // Wait for verifySession promise
        });
        expect(mockSetUser).toHaveBeenCalledWith(mockUser);
    });

    it('should redirect to login if session is invalid and not on auth page', async () => {
        // Mock state: finished loading, no user
        (useAuthStore as any).mockReturnValue({
            user: null,
            isLoading: false,
            isAuthenticated: false,
            setUser: mockSetUser,
            setLoading: mockSetLoading,
        });
        (usePathname as any).mockReturnValue('/dashboard');

        renderHook(() => useAuth());

        // Redirection happens in useEffect
        expect(mockRouter.push).toHaveBeenCalledWith(ROUTES.LOGIN);
    });

    it('should NOT redirect if on login page', async () => {
        (useAuthStore as any).mockReturnValue({
            user: null,
            isLoading: false,
            isAuthenticated: false,
            setUser: mockSetUser,
            setLoading: mockSetLoading,
        });
        (usePathname as any).mockReturnValue(ROUTES.LOGIN);

        renderHook(() => useAuth());

        expect(mockRouter.push).not.toHaveBeenCalled();
    });
});
