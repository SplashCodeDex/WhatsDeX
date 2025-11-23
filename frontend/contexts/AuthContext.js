
'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import apiClient from '../lib/apiClient';
import { useRouter } from 'next/navigation';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [tenant, setTenant] = useState(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        checkAuth();
    }, []);

    const checkAuth = async () => {
        const token = localStorage.getItem('auth_token');
        if (!token) {
            setLoading(false);
            return;
        }

        try {
            const data = await apiClient.getMe();
            setUser(data.user);
            setTenant(data.tenant);
        } catch (error) {
            console.error('Auth check failed:', error);
            logout();
        } finally {
            setLoading(false);
        }
    };

    const login = async (email, password, subdomain) => {
        try {
            const response = await apiClient.login({ email, password, subdomain });
            const { token, user, tenant } = response;

            localStorage.setItem('auth_token', token);
            setUser(user);
            setTenant(tenant);

            return { success: true };
        } catch (error) {
            return {
                success: false,
                error: error.message || 'Login failed'
            };
        }
    };

    const register = async (userData) => {
        try {
            const response = await apiClient.register(userData);
            const { token, user, tenant } = response;

            localStorage.setItem('auth_token', token);
            setUser(user);
            setTenant(tenant);

            return { success: true };
        } catch (error) {
            return {
                success: false,
                error: error.message || 'Registration failed'
            };
        }
    };

    const logout = () => {
        localStorage.removeItem('auth_token');
        setUser(null);
        setTenant(null);
        router.push('/login');
    };

    return (
        <AuthContext.Provider value={{
            user,
            tenant,
            loading,
            login,
            register,
            logout,
            isAuthenticated: !!user
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
