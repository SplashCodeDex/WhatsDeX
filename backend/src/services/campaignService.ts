import { firebaseService } from './FirebaseService.js';
import { multiTenantBotService } from './multiTenantBotService.js';
import { webhookService } from './webhookService.js';
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

            // Run execution in background
            this.executeCampaign(tenantId, campaign).catch(err => {
                logger.error(`Campaign ${campaignId} execution failed:`, err);
            });

            return { success: true, data: undefined };
        } catch (error: unknown) {
            const err = error instanceof Error ? error : new Error(String(error));
            logger.error(`CampaignService.startCampaign error [${tenantId}/${campaignId}]:`, err);
            return { success: false, error: err };
        }
    }

    /**
     * Internal execution logic with delays to prevent anti-ban
     */
    private async executeCampaign(tenantId: string, campaign: Campaign): Promise<void> {
        const { id, botId, message, audience } = campaign;
        const targets = audience.targets;

        let sent = 0;
        let failed = 0;

        for (const target of targets) {
            try {
                // Send message via bot service
                const result = await multiTenantBotService.sendMessage(tenantId, botId, {
                    to: target,
                    text: message,
                    type: 'text'
                });

                if (result.success) {
                    sent++;
                } else {
                    failed++;
                    logger.warn(`Campaign ${id} failed to send to ${target}:`, result.error);
                }

                // Random delay between 5-15 seconds (Safety)
                const delay = Math.floor(Math.random() * (15000 - 5000 + 1)) + 5000;
                await new Promise(resolve => setTimeout(resolve, delay));

                // Periodic stats update every 5 messages
                if ((sent + failed) % 5 === 0) {
                    await this.updateCampaignStats(tenantId, id, { sent, failed, pending: targets.length - (sent + failed) });
                }

            } catch (err) {
                failed++;
                logger.error(`Campaign ${id} loop error:`, err);
            }
        }

        // Final update
        await firebaseService.setDoc<'tenants/{tenantId}/campaigns'>(
            'campaigns',
            id,
            {
                status: 'completed' as CampaignStatus,
                stats: { sent, failed, pending: 0, total: targets.length },
                updatedAt: Timestamp.now().toDate()
            },
            tenantId,
            true
        );

        logger.info(`Campaign ${id} finished. Sent: ${sent}, Failed: ${failed}`);

        // Webhook Dispatch
        await webhookService.dispatch(tenantId, 'campaign.completed', {
            campaignId: id,
            name: campaign.name,
            stats: { sent, failed, total: targets.length }
        });
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

    private async updateCampaignStats(tenantId: string, campaignId: string, stats: Partial<Campaign['stats']>): Promise<void> {
        await firebaseService.setDoc<'tenants/{tenantId}/campaigns'>(
            'campaigns',
            campaignId,
            { stats: stats as any, updatedAt: Timestamp.now().toDate() },
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
        } catch (error: unknown) {
            const err = error instanceof Error ? error : new Error(String(error));
            return { success: false, error: err };
        }
    }
}

export const campaignService = new CampaignService();
export default campaignService;
