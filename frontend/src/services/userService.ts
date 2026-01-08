import { http } from '@/lib/apiClientCore';

export const userService = {
    async getUsers(params: Record<string, string> = {}): Promise<any> {
        const qs = new URLSearchParams(params).toString();
        return http.get(`/users?${qs}`);
    },

    async getUser(id: string): Promise<any> {
        return http.get(`/users/${id}`);
    },

    async updateUser(id: string, data: any): Promise<any> {
        return http.put(`/users/${id}`, data);
    },

    async createUser(data: any): Promise<any> {
        return http.post(`/users`, data);
    },

    async deleteUser(id: string): Promise<any> {
        return http.delete(`/users/${id}`);
    }
};
