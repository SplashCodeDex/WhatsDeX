'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { authService } from '@/services/authService';
import { useRouter } from 'next/navigation';

export interface User {
    id: string;
    name?: string;
    email: string;
    role?: string;
}

export interface Tenant {
    id: string;
    name: string;
    subdomain: string;
    plan?: string;
    limits?: {
        maxBots: number;
        maxMessages: number;
        maxUsers: number;
    };
}

interface LoginResult {
    success: boolean;
    error?: string;
}

interface RegisterData {
    companyName: string;
    subdomain: string;
    email: string;
    password: string;
    name: string;
}

interface AuthContextValue {
    user: User | null;
    tenant: Tenant | null;
    loading: boolean;
    login: (email: string, password: string, subdomain: string) => Promise<LoginResult>;
    register: (userData: RegisterData) => Promise<LoginResult>;
    logout: () => void;
    checkAvailability: (params: Record<string, string>) => Promise<any>;
    isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

interface AuthProviderProps {
    children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [tenant, setTenant] = useState<Tenant | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    const logout = useCallback((): void => {
        localStorage.removeItem('auth_token');
        setUser(null);
        setTenant(null);
        router.push('/login');
    }, [router]);

    const checkAuth = useCallback(async (): Promise<void> => {
        const token = localStorage.getItem('auth_token');
        if (!token) {
            setLoading(false);
            return;
        }

        try {
            const response = await authService.getMe();
            setUser(response.user as User);
            setTenant(response.tenant as Tenant);
        } catch (error) {
            console.error('Auth check failed:', error);
            logout();
        } finally {
            setLoading(false);
        }
    }, [logout]);

    useEffect(() => {
        checkAuth();
    }, [checkAuth]);

    const login = async (email: string, password: string, subdomain: string): Promise<LoginResult> => {
        try {
            const response: any = await authService.login({ email, password, subdomain } as any);
            const { token, user: userData, tenant: tenantData } = response;

            localStorage.setItem('auth_token', token);
            setUser(userData as User);
            setTenant(tenantData as Tenant);

            return { success: true };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Login failed'
            };
        }
    };

    const register = async (userData: RegisterData): Promise<LoginResult> => {
        try {
            const response: any = await authService.register(userData);
            const { token, user: newUser, tenant: newTenant } = response;

            localStorage.setItem('auth_token', token);
            setUser(newUser as User);
            setTenant(newTenant as Tenant);

            return { success: true };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Registration failed'
            };
        }
    };

    const checkAvailability = async (params: Record<string, string>): Promise<any> => {
        return authService.checkAvailability(params);
    };

    return (
        <AuthContext.Provider value={{
            user,
            tenant,
            loading,
            login,
            register,
            logout,
            checkAvailability,
            isAuthenticated: !!user
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = (): AuthContextValue => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
