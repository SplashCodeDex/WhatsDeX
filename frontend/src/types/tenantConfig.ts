export interface TenantSettings {
    ownerNumber?: string;
    ownerName?: string;
    maxBots?: number;
    features?: {
        aiEnabled: boolean;
        campaignsEnabled: boolean;
    };
    notifications?: {
        webhookUrl?: string;
        alertEmail?: string;
    };
}
