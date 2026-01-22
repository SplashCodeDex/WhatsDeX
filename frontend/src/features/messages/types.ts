export type CampaignStatus = 'draft' | 'pending' | 'sending' | 'completed' | 'paused' | 'error' | 'cancelled';

export interface CampaignStats {
    total: number;
    sent: number;
    failed: number;
    pending: number;
}

export interface Campaign {
    id: string;
    tenantId: string;
    name: string;
    templateId: string;
    audience: {
        type: 'groups' | 'contacts' | 'audience';
        targetId: string;
    };
    distribution: {
        type: 'single' | 'pool';
        botId?: string;
    };
    antiBan: {
        aiSpinning: boolean;
        minDelay: number;
        maxDelay: number;
    };
    schedule: {
        type: 'immediate' | 'scheduled';
        scheduledAt?: string;
    };
    stats: CampaignStats;
    status: CampaignStatus;
    createdAt: string;
    updatedAt: string;
    metadata?: Record<string, any>;
}

export interface MessageTemplate {
    id: string;
    tenantId: string;
    name: string;
    content: string;
    category: 'marketing' | 'utility' | 'authentication';
    mediaType: 'text' | 'image' | 'video' | 'document';
    mediaUrl?: string;
    createdAt: string;
    updatedAt: string;
}