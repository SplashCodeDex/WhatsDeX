/**
 * @fileoverview Central type definitions for WhatsDeX frontend
 */

import type { ReactNode } from 'react';

// User types
export interface User {
    id: string;
    email: string;
    name: string;
    avatar?: string;
    phone?: string;
    jid?: string;
    status?: string;
    role: 'admin' | 'user' | 'moderator';
    plan: 'free' | 'basic' | 'pro' | 'enterprise';
    createdAt: Date;
    updatedAt: Date;
}

// Auth types
export interface AuthState {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    error: string | null;
}

export interface LoginCredentials {
    email: string;
    password: string;
}

export interface RegisterData extends LoginCredentials {
    name: string;
    subdomain?: string;
}

// API Response types
export interface ApiResponse<T = unknown> {
    success: boolean;
    data?: T;
    error?: {
        code: string;
        message: string;
    };
}

// Bot types
export interface Bot {
    id: string;
    name: string;
    phoneNumber: string;
    status: 'connected' | 'disconnected' | 'connecting' | 'scanning' | 'error';
    qrCode?: string;
    createdAt: Date;
}

// Subscription types
export interface Subscription {
    id: string;
    plan: 'free' | 'basic' | 'pro' | 'enterprise';
    status: 'active' | 'cancelled' | 'past_due';
    currentPeriodEnd: Date;
}

// Analytics types
export interface AnalyticsData {
    totalMessages: number;
    totalUsers: number;
    activeUsers: number;
    aiRequests: number;
}

export interface MenuItem {
    label: string;
    actionType: 'reply' | 'link' | 'command';
    payload: string;
}

export interface Template {
    id: string;
    name: string;
    description: string;
    category: string;
    icon: string;
    welcomeMessage: string;
    menuItems: MenuItem[];
    popular: boolean;
}

// Component prop types
export interface WithChildren {
    children: ReactNode;
}

export interface WithClassName {
    className?: string;
}
