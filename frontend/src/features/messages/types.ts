export type CampaignStatus = 'draft' | 'pending' | 'sending' | 'completed' | 'paused' | 'error' | 'cancelled';

export interface CampaignStats {
    total: number;
    sent: number;
    failed: number;
    pending: number;
}

export interface Campaign {
    id: string;
    name: string;
    botId: string;
    message: string;
    audience: {
        type: 'groups' | 'contacts' | 'selective';
        targets: string[];
    };
    schedule: {
        type: 'immediate' | 'scheduled';
        scheduledAt?: string;
    };
    stats: CampaignStats;
    status: CampaignStatus;
    createdAt: string;
    updatedAt: string;
}
