/**
 * API Endpoint Constants
 *
 * Centralized endpoint definitions for type-safe API calls.
 */

export const API_ENDPOINTS = {
    // Auth
    AUTH: {
        LOGIN: '/auth/login',
        REGISTER: '/auth/register',
        LOGOUT: '/auth/logout',
        VERIFY: '/auth/me', // Changed from verify to me to match backend
        FORGOT_PASSWORD: '/auth/forgot-password',
        RESET_PASSWORD: '/auth/reset-password',
        REFRESH: '/auth/refresh',
    },

    // Bots (Protected via /api/internal)
    BOTS: {
        LIST: '/internal/bots',
        GET: (botId: string) => `/internal/bots/${botId}` as const,
        CREATE: '/internal/bots',
        UPDATE: (botId: string) => `/internal/bots/${botId}` as const,
        DELETE: (botId: string) => `/internal/bots/${botId}` as const,
        CONNECT: (botId: string) => `/internal/bots/${botId}/connect` as const,
        DISCONNECT: (botId: string) => `/internal/bots/${botId}/disconnect` as const,
        QR_CODE: (botId: string) => `/internal/bots/${botId}/qr` as const,
        STATUS: (botId: string) => `/internal/bots/${botId}/status` as const,
    },

    // Messages
    MESSAGES: {
        LIST: '/messages',
        GET: (messageId: string) => `/messages/${messageId}` as const,
        SEND: '/messages/send',
        BULK_SEND: '/messages/bulk',
        SCHEDULE: '/messages/schedule',
    },

    // Contacts
    CONTACTS: {
        LIST: '/contacts',
        GET: (contactId: string) => `/contacts/${contactId}` as const,
        CREATE: '/contacts',
        UPDATE: (contactId: string) => `/contacts/${contactId}` as const,
        DELETE: (contactId: string) => `/contacts/${contactId}` as const,
        IMPORT: '/contacts/import',
        EXPORT: '/contacts/export',
    },

    // Analytics
    ANALYTICS: {
        DASHBOARD: '/analytics/dashboard',
        MESSAGES: '/analytics/messages',
        BOTS: '/analytics/bots',
    },

    // Settings
    SETTINGS: {
        PROFILE: '/settings/profile',
        NOTIFICATIONS: '/settings/notifications',
        API_KEYS: '/settings/api-keys',
    },

    // Billing
    BILLING: {
        SUBSCRIPTION: '/billing/subscription',
        INVOICES: '/billing/invoices',
        PAYMENT_METHODS: '/billing/payment-methods',
        CHECKOUT: '/billing/checkout',
        PORTAL: '/billing/portal',
    },

    // Health
    HEALTH: '/health',
} as const;

export type ApiEndpoint = typeof API_ENDPOINTS;
