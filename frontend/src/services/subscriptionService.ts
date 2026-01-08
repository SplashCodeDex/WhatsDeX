import { http } from '@/lib/apiClientCore';

export const subscriptionService = {
    async getSubscription(): Promise<any> {
        return http.get('/subscription');
    },

    async createSubscription(data: any): Promise<any> {
        return http.post('/subscription', data);
    },

    async cancelSubscription(): Promise<any> {
        return http.delete('/subscription');
    }
};
