import { Worker, Job } from 'bullmq';
import { Campaign, CampaignStatus } from '../types/contracts.js';
import { multiTenantBotService } from '../services/multiTenantBotService.js';
import { firebaseService } from '../services/FirebaseService.js';
import { webhookService } from '../services/webhookService.js';
import { campaignSocketService } from '../services/campaignSocketService.js';
import logger from '../utils/logger.js';
import { Timestamp } from 'firebase-admin/firestore';

const redisOptions = {
    host: process.env.REDIS_HOST || 'localhost',
    port: Number(process.env.REDIS_PORT) || 6379,
    password: process.env.REDIS_PASSWORD,
    maxRetriesPerRequest: null,
};

interface CampaignJobData {
    tenantId: string;
    campaign: Campaign;
}

class CampaignWorker {
    private worker: any;

    constructor() {
        this.worker = new Worker(
            'campaigns',
            async (job: any) => {
                await this.processCampaign(job);
            },
            {
                connection: redisOptions,
                concurrency: 5,
                limiter: {
                    max: 10,
                    duration: 1000
                }
            } as any
        );

        this.worker.on('completed', (job: any) => {
            logger.info(`Campaign Job ${job.id} completed`, { jobId: job.id });
        });

        this.worker.on('failed', (job: any, err: any) => {
            logger.error(`Campaign Job ${job?.id} failed:`, err);
        });

        logger.info('CampaignWorker initialized');
    }

    private async processCampaign(job: any): Promise<void> {
        const { tenantId, campaign } = job.data;
        const { id, botId, message, audience } = campaign;
        const targets = audience.targets;

        logger.info(`Processing campaign ${id} for tenant ${tenantId}`, {
            tenantId,
            campaignId: id,
            botId,
            targetCount: targets.length
        });

        // Fetch current campaign state to handle resume/pause correctly
        const currentDoc = await firebaseService.getDoc<'tenants/{tenantId}/campaigns'>('campaigns', id, tenantId);

        // Determine starting index based on existing stats (for Resume support)
        const startIndex = (currentDoc?.stats?.sent || 0) + (currentDoc?.stats?.failed || 0);

        logger.info(`Campaign ${id} starting from index ${startIndex}/${targets.length}`, {
            tenantId,
            campaignId: id,
            startIndex
        });

        let sent = currentDoc?.stats?.sent || 0;
        let failed = currentDoc?.stats?.failed || 0;

        for (let i = startIndex; i < targets.length; i++) {
            const target = targets[i];

            // Re-check status periodically (every message is safer for "instant" pause)
            const doc = await firebaseService.getDoc<'tenants/{tenantId}/campaigns'>('campaigns', id, tenantId);
            if (!doc || doc.status === 'paused' || doc.status === 'cancelled') {
                logger.info(`Campaign ${id} stopped/paused [status: ${doc?.status}]`, {
                    tenantId,
                    campaignId: id,
                    status: doc?.status,
                    progress: sent + failed
                });
                await this.updateCampaignStats(tenantId, id, { sent, failed, pending: targets.length - (sent + failed) });
                return; // Exit loop, job will be re-added when resumed
            }

            try {
                // Send Message
                const result = await multiTenantBotService.sendMessage(tenantId, botId, {
                    to: target,
                    text: message,
                    type: 'text'
                });

                if (result.success) {
                    sent++;
                } else {
                    failed++;
                    logger.warn(`Campaign ${id} send failed to ${target}`, {
                        tenantId,
                        campaignId: id,
                        target,
                        error: result.error
                    });
                }

                // Stats Update (Update every 5 or on final)
                if ((sent + failed) % 5 === 0 || i === targets.length - 1) {
                    await this.updateCampaignStats(tenantId, id, { sent, failed, pending: targets.length - (sent + failed) });
                }

                // Emit real-time progress via Socket.io
                campaignSocketService.emitProgress(tenantId, id, {
                    sent,
                    failed,
                    total: targets.length,
                    status: 'sending'
                });

                // Anti-Ban Delay (5-15s) - Skip delay if it's the last one
                if (i < targets.length - 1) {
                    const delay = Math.floor(Math.random() * (15000 - 5000 + 1)) + 5000;
                    await new Promise(resolve => setTimeout(resolve, delay));
                }

            } catch (err) {
                failed++;
                logger.error(`Campaign ${id} loop error for ${target}`, {
                    tenantId,
                    campaignId: id,
                    target,
                    error: err
                });
                await this.updateCampaignStats(tenantId, id, { sent, failed, pending: targets.length - (sent + failed) });
            }
        }

        // Final Completion Update
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

        // Notify Webhooks
        await webhookService.dispatch(tenantId, 'campaign.completed', {
            campaignId: id,
            name: campaign.name,
            stats: { sent, failed, total: targets.length }
        });
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
}

export const campaignWorker = new CampaignWorker();
