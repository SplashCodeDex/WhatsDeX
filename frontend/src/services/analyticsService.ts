import { http } from '@/lib/apiClientCore';

export const analyticsService = {
    async getAdminMetrics(period: string): Promise<any> {
        return http.get(`/admin/metrics?period=${period}`);
    },

    async getAnalytics(tenantId: string): Promise<any> {
        return http.get(`/analytics/overview?tenantId=${tenantId}`);
    }
};
