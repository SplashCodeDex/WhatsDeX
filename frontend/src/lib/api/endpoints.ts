/**
 * API Endpoint Constants
 *
 * Centralized endpoint definitions for type-safe API calls.
 */

export const API_ENDPOINTS = {
    // Auth
    AUTH: {
        LOGIN: '/api/auth/login',
        REGISTER: '/api/auth/register',
        LOGOUT: '/api/auth/logout',
        VERIFY: '/api/auth/me',
        FORGOT_PASSWORD: '/api/auth/forgot-password',
        RESET_PASSWORD: '/api/auth/reset-password',
        REFRESH: '/api/auth/refresh',
    },

    // Bots (Protected via /api/internal)
    BOTS: {
        LIST: '/api/internal/bots',
        GET: (botId: string) => `/api/internal/bots/${botId}` as const,
        CREATE: '/api/internal/bots',
        UPDATE: (botId: string) => `/api/internal/bots/${botId}` as const,
        DELETE: (botId: string) => `/api/internal/bots/${botId}` as const,
        CONNECT: (botId: string) => `/api/internal/bots/${botId}/connect` as const,
        DISCONNECT: (botId: string) => `/api/internal/bots/${botId}/disconnect` as const,
        QR_CODE: (botId: string) => `/api/internal/bots/${botId}/qr` as const,
        PAIRING_CODE: (botId: string) => `/api/internal/bots/${botId}/pairing-code` as const,
        STATUS: (botId: string) => `/api/internal/bots/${botId}/status` as const,
    },

    // Messages
    MESSAGES: {
        LIST: '/api/messages',
        GET: (messageId: string) => `/api/messages/${messageId}` as const,
        SEND: '/api/messages/send',
        BULK_SEND: '/api/messages/bulk',
        SCHEDULE: '/api/messages/schedule',
    },

    // Contacts
    CONTACTS: {
        LIST: '/api/contacts',
        GET: (contactId: string) => `/api/contacts/${contactId}` as const,
        CREATE: '/api/contacts',
        UPDATE: (contactId: string) => `/api/contacts/${contactId}` as const,
        DELETE: (contactId: string) => `/api/contacts/${contactId}` as const,
        IMPORT: '/api/contacts/import',
        EXPORT: '/api/contacts/export',
    },

    // Analytics
    ANALYTICS: {
        DASHBOARD: '/api/analytics/dashboard',
        MESSAGES: '/api/analytics/messages',
        BOTS: '/api/analytics/bots',
    },

    // Settings
    SETTINGS: {
        PROFILE: '/api/settings/profile',
        NOTIFICATIONS: '/api/settings/notifications',
        API_KEYS: '/api/settings/api-keys',
    },

    // Billing
    BILLING: {
        SUBSCRIPTION: '/api/billing/subscription',
        INVOICES: '/api/billing/invoices',
        PAYMENT_METHODS: '/api/billing/payment-methods',
        CHECKOUT: '/api/billing/checkout',
        PORTAL: '/api/billing/portal',
    },

    // Health
    HEALTH: '/api/health',

    // Omnichannel
    OMNICHANNEL: {
        STATUS: '/api/omnichannel/status',
    },
} as const;

export type ApiEndpoint = typeof API_ENDPOINTS;
