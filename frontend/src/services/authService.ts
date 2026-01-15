import { http } from '@/lib/apiClientCore';
import type { RegisterData, LoginCredentials, ApiResponse } from '@/types';

export const authService = {
    async register(userData: RegisterData): Promise<any> {
        return http.post('/api/auth/register', userData);
    },

    async login(credentials: LoginCredentials): Promise<any> {
        return http.post('/api/auth/login', credentials);
    },

    async getMe(): Promise<any> {
        return http.get('/api/auth/me');
    },

    async checkAvailability(params: Record<string, string>): Promise<any> {
        const queryString = new URLSearchParams(params).toString();
        return http.get(`/api/auth/availability?${queryString}`);
    }
};
