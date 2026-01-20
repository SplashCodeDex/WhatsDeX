import { firebaseService } from './FirebaseService.js';
import { queueService } from './queueService.js';
import { Campaign, CampaignSchema, CampaignStatus, Result } from '../types/contracts.js';
import { Timestamp } from 'firebase-admin/firestore';
import logger from '../utils/logger.js';

export class CampaignService {
    /**
     * Create a new campaign for a tenant
     */
    async createCampaign(tenantId: string, data: Partial<Campaign>): Promise<Result<Campaign>> {
        try {
            const campaignId = `camp_${Date.now()}`;
            const rawCampaign = {
                id: campaignId,
                name: data.name || 'New Campaign',
                botId: data.botId,
                message: data.message,
                audience: data.audience || { type: 'selective', targets: [] },
                schedule: data.schedule || { type: 'immediate' },
                stats: {
                    total: data.audience?.targets?.length || 0,
                    sent: 0,
                    failed: 0,
                    pending: data.audience?.targets?.length || 0
                },
                status: 'draft' as CampaignStatus,
                createdAt: Timestamp.now().toDate(),
                updatedAt: Timestamp.now().toDate(),
                ...data
            };

            const campaign = CampaignSchema.parse(rawCampaign);
            await firebaseService.setDoc<'tenants/{tenantId}/campaigns'>('campaigns', campaignId, campaign as any, tenantId);

            return { success: true, data: campaign };
        } catch (error: unknown) {
            const err = error instanceof Error ? error : new Error(String(error));
            logger.error(`CampaignService.createCampaign error [${tenantId}]:`, err);
            return { success: false, error: err };
        }
    }

    /**
     * Get all campaigns for a tenant
     */
    async getCampaigns(tenantId: string): Promise<Result<Campaign[]>> {
        try {
            const campaigns = await firebaseService.getCollection<'tenants/{tenantId}/campaigns'>('campaigns', tenantId);
            return { success: true, data: campaigns as Campaign[] };
        } catch (error: unknown) {
            const err = error instanceof Error ? error : new Error(String(error));
            logger.error(`CampaignService.getCampaigns error [${tenantId}]:`, err);
            return { success: false, error: err };
        }
    }

    /**
     * Start a campaign execution
     */
    async startCampaign(tenantId: string, campaignId: string): Promise<Result<void>> {
        try {
            const campaignDoc = await firebaseService.getDoc<'tenants/{tenantId}/campaigns'>('campaigns', campaignId, tenantId);
            if (!campaignDoc) return { success: false, error: new Error('Campaign not found') };

            const campaign = CampaignSchema.parse(campaignDoc);
            if (campaign.status === 'sending' || campaign.status === 'completed') {
                return { success: false, error: new Error(`Campaign is already ${campaign.status}`) };
            }

            // Update status to sending
            await this.updateCampaignStatus(tenantId, campaignId, 'sending');

            // Add to Queue (Worker will pick up the current progress)
            await queueService.addCampaignJob(tenantId, { ...campaign, status: 'sending' });

            return { success: true, data: undefined };
        } catch (error: unknown) {
            const err = error instanceof Error ? error : new Error(String(error));
            logger.error(`CampaignService.startCampaign error [${tenantId}/${campaignId}]:`, err);
            return { success: false, error: err };
        }
    }

    /**
     * Pause a campaign execution
     */
    async pauseCampaign(tenantId: string, campaignId: string): Promise<Result<void>> {
        try {
            await this.updateCampaignStatus(tenantId, campaignId, 'paused');
            return { success: true, data: undefined };
        } catch (error: unknown) {
            const err = error instanceof Error ? error : new Error(String(error));
            logger.error(`CampaignService.pauseCampaign error [${tenantId}/${campaignId}]:`, err);
            return { success: false, error: err };
        }
    }

    /**
     * Resume a paused campaign
     */
    async resumeCampaign(tenantId: string, campaignId: string): Promise<Result<void>> {
        try {
            const campaignDoc = await firebaseService.getDoc<'tenants/{tenantId}/campaigns'>('campaigns', campaignId, tenantId);
            if (!campaignDoc) return { success: false, error: new Error('Campaign not found') };

            const campaign = CampaignSchema.parse(campaignDoc);

            // Re-trigger the job. The worker logic will see the updated status and continue from the last index stored in metadata/stats.
            await this.updateCampaignStatus(tenantId, campaignId, 'sending');
            await queueService.addCampaignJob(tenantId, { ...campaign, status: 'sending' });

            return { success: true, data: undefined };
        } catch (error: unknown) {
            const err = error instanceof Error ? error : new Error(String(error));
            logger.error(`CampaignService.resumeCampaign error [${tenantId}/${campaignId}]:`, err);
            return { success: false, error: err };
        }
    }

    private async updateCampaignStatus(tenantId: string, campaignId: string, status: CampaignStatus): Promise<void> {
        await firebaseService.setDoc<'tenants/{tenantId}/campaigns'>(
            'campaigns',
            campaignId,
            { status, updatedAt: Timestamp.now().toDate() },
            tenantId,
            true
        );
    }

    /**
     * Delete a campaign
     */
    async deleteCampaign(tenantId: string, campaignId: string): Promise<Result<void>> {
        try {
            await firebaseService.deleteDoc<'tenants/{tenantId}/campaigns'>('campaigns', campaignId, tenantId);
            return { success: true, data: undefined };
        } catch (error: boolean | any) {
            const err = error instanceof Error ? error : new Error(String(error));
            return { success: false, error: err };
        }
    }

    /**
     * Duplicate an existing campaign as a draft
     */
    async duplicateCampaign(tenantId: string, campaignId: string): Promise<Result<Campaign>> {
        try {
            const campaignDoc = await firebaseService.getDoc<'tenants/{tenantId}/campaigns'>('campaigns', campaignId, tenantId);
            if (!campaignDoc) return { success: false, error: new Error('Campaign not found') };

            const original = CampaignSchema.parse(campaignDoc);

            // Create a copy as draft
            return await this.createCampaign(tenantId, {
                name: `${original.name} (Copy)`,
                message: original.message,
                botId: original.botId,
                audience: original.audience,
                status: 'draft'
            });
        } catch (error: unknown) {
            const err = error instanceof Error ? error : new Error(String(error));
            logger.error(`CampaignService.duplicateCampaign error [${tenantId}/${campaignId}]:`, err);
            return { success: false, error: err };
        }
    }
}

export const campaignService = new CampaignService();
export default campaignService;
