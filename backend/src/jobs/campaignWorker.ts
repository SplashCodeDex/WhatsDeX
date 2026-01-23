import { Worker, Job } from 'bullmq';
import { Campaign, CampaignStatus, MessageTemplate, Contact, Audience } from '../types/contracts.js';
import { multiTenantBotService } from '../services/multiTenantBotService.js';
import { firebaseService } from '../services/FirebaseService.js';
import { webhookService } from '../services/webhookService.js';
import { socketService } from '../services/socketService.js';
import { TemplateService } from '../services/templateService.js';
import { GeminiAI } from '../services/geminiAI.js';
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
            async (job: Job<CampaignJobData>) => {
                await this.processCampaign(job);
            },
            {
                connection: redisOptions,
                concurrency: 2, // Process 2 campaigns at once per instance
                limiter: {
                    max: 10,
                    duration: 1000
                }
            } as any
        );

        this.worker.on('completed', (job: Job<CampaignJobData>) => {
            logger.info(`Campaign Job ${job.id} completed`);
        });

        this.worker.on('failed', (job: Job<CampaignJobData> | undefined, err: Error) => {
            logger.error(`Campaign Job ${job?.id} failed:`, err);
        });

        logger.info('CampaignWorker initialized with enhanced features');
    }

    private async processCampaign(job: Job<CampaignJobData>): Promise<void> {
        const { tenantId, campaign } = job.data;
        const { id, targetId } = { ...campaign, targetId: campaign.audience.targetId };

        // 1. Fetch Latest Campaign & Template
        const currentCampaign = await firebaseService.getDoc<'tenants/{tenantId}/campaigns'>('campaigns', id, tenantId);
        if (!currentCampaign) throw new Error('Campaign not found');

        const templateResult = await TemplateService.getInstance().getTemplate(tenantId, currentCampaign.templateId);
        if (!templateResult.success || !templateResult.data) throw new Error('Template not found');
        const template = templateResult.data;

        // 2. Load Targets (Contacts)
        const targets = await this.loadTargets(tenantId, currentCampaign.audience);
        if (targets.length === 0) {
            await this.finalizeCampaign(tenantId, id, 0, 0, 0);
            return;
        }

        // 3. Update Total Stats
        await this.updateCampaignStats(tenantId, id, { total: targets.length, pending: targets.length });

        // 4. Distribution Strategy
        const bots = await this.getAvailableBots(tenantId, currentCampaign.distribution);
        if (bots.length === 0) throw new Error('No active bots available for broadcast');

        let sent = currentCampaign.stats.sent || 0;
        let failed = currentCampaign.stats.failed || 0;
        const startIndex = sent + failed;

        await this.updateCampaignStatus(tenantId, id, 'sending');

        for (let i = startIndex; i < targets.length; i++) {
            const contact = targets[i];

            // Check for Pause/Cancel
            const statusCheck = await firebaseService.getDoc<'tenants/{tenantId}/campaigns'>('campaigns', id, tenantId);
            if (!statusCheck || statusCheck.status === 'paused' || statusCheck.status === 'cancelled') {
                return;
            }

            // Round-robin through bot pool
            const bot = bots[i % bots.length];

            try {
                // Prepare Message (Spin + Inject)
                const content = await this.prepareMessage(tenantId, template, contact, currentCampaign.antiBan.aiSpinning);

                const result = await multiTenantBotService.sendMessage(tenantId, bot.id, {
                    to: contact.phone,
                    text: content,
                    type: 'text'
                });

                if (result.success) sent++; else failed++;

                // Progress Reporting
                if (i % 5 === 0 || i === targets.length - 1) {
                    await this.updateCampaignStats(tenantId, id, { sent, failed, pending: targets.length - (sent + failed) });
                    socketService.emitProgress(tenantId, id, { sent, failed, total: targets.length, status: 'sending' });
                }

                // Intelligent Throttling
                if (i < targets.length - 1) {
                    const delay = Math.floor(Math.random() * (currentCampaign.antiBan.maxDelay - currentCampaign.antiBan.minDelay + 1) + currentCampaign.antiBan.minDelay) * 1000;
                    await new Promise(r => setTimeout(r, delay));
                }

            } catch (err) {
                failed++;
                logger.error(`Campaign error for ${contact.phone}:`, err);
            }
        }

        await this.finalizeCampaign(tenantId, id, sent, failed, targets.length);
    }

    private async loadTargets(tenantId: string, audience: Campaign['audience']): Promise<Contact[]> {
        if (audience.type === 'audience') {
            // Load from Audience subcollection
            const aud = await firebaseService.getDoc<'tenants/{tenantId}/audiences'>('audiences', audience.targetId, tenantId);
            if (!aud) return [];
            // For now, simplify: fetch ALL contacts and filter. In 2026 production, this would be a Firestore Query.
            const allContacts = await firebaseService.getCollection<'tenants/{tenantId}/contacts'>('contacts', tenantId);
            // Apply aud.filters (Basic tag filter implementation)
            if (aud.filters && aud.filters.tags) {
                return allContacts.filter(c => c.tags.some(t => aud.filters.tags.includes(t)));
            }
            return allContacts;
        }
        // Group support TODO
        return [];
    }

    private async getAvailableBots(tenantId: string, distribution: Campaign['distribution']) {
        const allBots = await firebaseService.getCollection<'tenants/{tenantId}/bots'>('bots', tenantId);
        const activeBots = allBots.filter(b => b.status === 'connected');

        if (distribution.type === 'single' && distribution.botId) {
            return activeBots.filter(b => b.id === distribution.botId);
        }
        return activeBots;
    }

    private async prepareMessage(tenantId: string, template: MessageTemplate, contact: Contact, spin: boolean): Promise<string> {
        let content = template.content;

        // 1. Inject Variables
        const vars = {
            name: contact.name,
            phone: contact.phone,
            email: contact.email,
            ...(contact.attributes || {})
        };

        for (const [key, value] of Object.entries(vars)) {
            content = content.replace(new RegExp(`{{${key}}}`, 'g'), String(value));
        }

        // 2. AI Spinning (Rule 5 Memoized)
        if (spin) {
            const spinResult = await GeminiAI.spinMessage(content, tenantId);
            if (spinResult.success) content = spinResult.data;
        }

        return content;
    }

    private async updateCampaignStats(tenantId: string, campaignId: string, stats: Partial<Campaign['stats']>): Promise<void> {
        await firebaseService.setDoc<'tenants/{tenantId}/campaigns'>('campaigns', campaignId, { stats: stats as any, updatedAt: new Date() }, tenantId, true);
    }

    private async updateCampaignStatus(tenantId: string, campaignId: string, status: CampaignStatus): Promise<void> {
        await firebaseService.setDoc<'tenants/{tenantId}/campaigns'>('campaigns', campaignId, { status, updatedAt: new Date() }, tenantId, true);
    }

    private async finalizeCampaign(tenantId: string, id: string, sent: number, failed: number, total: number) {
        await firebaseService.setDoc<'tenants/{tenantId}/campaigns'>('campaigns', id, {
            status: 'completed',
            stats: { sent, failed, pending: 0, total },
            updatedAt: new Date()
        }, tenantId, true);

        await webhookService.dispatch(tenantId, 'campaign.completed', { campaignId: id, stats: { sent, failed, total } });
    }
}

export const campaignWorker = new CampaignWorker();
