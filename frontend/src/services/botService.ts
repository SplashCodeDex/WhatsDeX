import { http } from '@/lib/apiClientCore';
import type { Bot } from '@/types';

export const botService = {
    async createBot(tenantId: string, botData: any): Promise<any> {
        return http.post(`/internal/tenants/${tenantId}/bots`, botData);
    },

    async getBots(tenantId: string): Promise<any> {
        return http.get(`/internal/tenants/${tenantId}/bots`);
    },

    async getBot(botId: string): Promise<any> {
        return http.get(`/bots/${botId}`);
    },

    async startBot(botId: string): Promise<any> {
        return http.post(`/bots/${botId}/start`);
    },

    async stopBot(botId: string): Promise<any> {
        return http.post(`/bots/${botId}/stop`);
    },

    async getBotQRCode(botId: string): Promise<any> {
        return http.get(`/bots/${botId}/qr`);
    },

    async getBotStatus(botId: string): Promise<any> {
        return http.get(`/bots/${botId}/status`);
    },

    async applyTemplate(botId: string, templateId: string): Promise<any> {
        return http.post(`/bots/${botId}/template`, { templateId });
    }
};
