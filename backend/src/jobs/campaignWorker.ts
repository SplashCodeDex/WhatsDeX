import { Worker, Job } from 'bullmq';
import { Campaign, CampaignStatus, MessageTemplate, Contact, Audience } from '../types/contracts.js';
import { multiTenantBotService } from '../services/multiTenantBotService.js';
import { firebaseService } from '../services/FirebaseService.js';
import { groupService } from '../services/groupService.js';
import { webhookService } from '../services/webhookService.js';
import { socketService } from '../services/socketService.js';
import { TemplateService } from '../services/templateService.js';
import { GeminiAI } from '../services/geminiAI.js';
import logger from '../utils/logger.js';
import { Timestamp } from 'firebase-admin/firestore';
import moment from 'moment-timezone';

/**
 * Gaussian Random Utility
 * Generates a number with a normal distribution around a mean.
 */
function gaussianRandom(min: number, max: number, skew: number = 1): number {
    let u = 0, v = 0;
    while (u === 0) u = Math.random();
    while (v === 0) v = Math.random();
    let num = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);

    num = num / 10.0 + 0.5; // Translate to 0 -> 1
    if (num > 1 || num < 0) num = gaussianRandom(min, max, skew); // resample between 0 and 1 if out of range
    num = Math.pow(num, skew); // Stretch to fill range
    num *= max - min; // stretch to fill range
    num += min; // offset to min
    return num;
}

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
        const { id } = campaign;

        // 1. Fetch Latest Campaign & Template
        const currentCampaign = await firebaseService.getDoc<'tenants/{tenantId}/campaigns'>('campaigns', id, tenantId);
        if (!currentCampaign) throw new Error('Campaign not found');

        // Check if finished or paused
        if (currentCampaign.status === 'completed' || currentCampaign.status === 'cancelled') return;
        if (currentCampaign.status === 'paused') {
            logger.info(`Campaign ${id} is paused. Job processed.`);
            return;
        }

        const templateResult = await TemplateService.getInstance().getTemplate(tenantId, currentCampaign.templateId);
        if (!templateResult.success || !templateResult.data) throw new Error('Template not found');
        const template = templateResult.data;

        // 2. Load Targets (Contacts)
        const targets = await this.loadTargets(tenantId, currentCampaign.audience);
        if (targets.length === 0) {
            await this.finalizeCampaign(tenantId, id, 0, 0, 0);
            return;
        }

        // 3. Update Total Stats if not already set
        if (!currentCampaign.stats.total) {
            await this.updateCampaignStats(tenantId, id, { total: targets.length, pending: targets.length });
        }

        // 4. Working Hours Check (Timezone Aware)
        if (currentCampaign.antiBan.workingHoursEnabled) {
            const tz = currentCampaign.antiBan.timezone || 'UTC';
            const now = moment().tz(tz);
            const startTimeStr = currentCampaign.antiBan.workingHoursStart;
            const endTimeStr = currentCampaign.antiBan.workingHoursEnd;

            const start = moment.tz(startTimeStr, 'HH:mm', tz);
            const end = moment.tz(endTimeStr, 'HH:mm', tz);

            if (now.isBefore(start) || now.isAfter(end)) {
                logger.info(`Campaign ${id} outside working hours in ${tz}. Current: ${now.format('HH:mm')}. Pausing...`);
                await this.updateCampaignStatus(tenantId, id, 'paused');
                // Could ideally auto-calculate delay until start and re-add to queue
                return;
            }
        }

        // 5. Get Active Bots
        const bots = await this.getAvailableBots(tenantId, currentCampaign.distribution);
        if (bots.length === 0) {
            logger.warn(`No active bots for campaign ${id}. Job will retry.`);
            throw new Error('No active bots available');
        }

        let sent = currentCampaign.stats.sent || 0;
        let failed = currentCampaign.stats.failed || 0;
        const total = targets.length;

        if (sent + failed >= total) {
            await this.finalizeCampaign(tenantId, id, sent, failed, total);
            return;
        }

        await this.updateCampaignStatus(tenantId, id, 'sending');

        // Number of messages to process in THIS job segment
        // If batchSize is configured, use it. Otherwise process a reasonable chunk (e.g. 50)
        const segmentSize = currentCampaign.antiBan.batchSize > 0 ? currentCampaign.antiBan.batchSize : 50;
        const endIndex = Math.min(sent + failed + segmentSize, total);

        logger.info(`Campaign ${id}: Processing segment from ${sent + failed} to ${endIndex}`);

        for (let i = sent + failed; i < endIndex; i++) {
            const contact = targets[i];

            // Internal check inside loop for pause
            if (i % 5 === 0) {
                const live = await firebaseService.getDoc<'tenants/{tenantId}/campaigns'>('campaigns', id, tenantId);
                if (live?.status === 'paused' || live?.status === 'cancelled') return;
            }

            const bot = bots[i % bots.length];
            try {
                const content = await this.prepareMessage(tenantId, template, contact, currentCampaign.antiBan.aiSpinning);

                // Typing Simulation
                let typingDelay = 0;
                if (currentCampaign.antiBan.typingSimulation) {
                    typingDelay = Math.floor(gaussianRandom(2, currentCampaign.antiBan.maxTypingDelay || 5) * 1000);
                }

                const result = await multiTenantBotService.sendMessage(tenantId, bot.id, {
                    to: contact.phone,
                    text: content,
                    type: 'text',
                    typingDelay
                });

                if (result.success) sent++;
                else failed++;

                // Progress Update (per message or small groups)
                if (i % 5 === 0 || i === endIndex - 1) {
                    await this.updateCampaignStats(tenantId, id, { sent, failed, pending: total - (sent + failed) });
                    socketService.emitProgress(tenantId, id, { sent, failed, total, status: 'sending' });
                }

                // Inter-message delay (only if not the last item in segment)
                if (i < endIndex - 1) {
                    const delay = Math.floor(gaussianRandom(currentCampaign.antiBan.minDelay, currentCampaign.antiBan.maxDelay) * 1000);
                    await new Promise(r => setTimeout(r, delay));
                }

            } catch (err) {
                failed++;
                logger.error(`Campaign ${id} message error for ${contact.phone}:`, err);
            }
        }

        // Segment Finished
        if (sent + failed < total) {
            // Schedule the NEXT segment
            let delayTime = 0;
            if (currentCampaign.antiBan.batchSize > 0) {
                // Batch pause (minutes)
                delayTime = Math.floor(gaussianRandom(currentCampaign.antiBan.batchPauseMin, currentCampaign.antiBan.batchPauseMax) * 60 * 1000);
                logger.info(`Campaign ${id}: Segment done. Scheduling next segment in ${delayTime / 60000} mins (Batch Pause).`);
            } else {
                // Short pause between segments
                delayTime = Math.floor(gaussianRandom(currentCampaign.antiBan.minDelay, currentCampaign.antiBan.maxDelay) * 1000);
            }

            // Re-add to queue
            await this.worker.queue.add('process-campaign', { tenantId, campaign: currentCampaign }, { delay: delayTime });
        } else {
            await this.finalizeCampaign(tenantId, id, sent, failed, total);
        }
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

        if (audience.type === 'groups') {
            const bots = await this.getAvailableBots(tenantId, { type: 'pool' } as any); // Get any available bot for sync if needed

            if (audience.targetId === 'all') {
                let groups = await firebaseService.getCollection<'tenants/{tenantId}/groups'>('groups', tenantId);

                // 2026 Strategy: Auto-sync if Firestore is empty
                if (groups.length === 0 && bots.length > 0) {
                    const activeBot = multiTenantBotService.getBotSocket(bots[0].id);
                    if (activeBot) {
                        logger.info(`Auto-syncing groups for tenant ${tenantId}`);
                        await groupService.syncAllGroups(activeBot);
                        groups = await firebaseService.getCollection<'tenants/{tenantId}/groups'>('groups', tenantId);
                    }
                }

                return groups.map(g => ({
                    id: g.id,
                    tenantId,
                    name: (g as any).subject || (g as any).name || 'Unknown Group',
                    phone: g.id, // JID
                    tags: [],
                    status: 'active' as const,
                    createdAt: new Date(),
                    updatedAt: new Date()
                } as Contact));
            } else {
                let group = await firebaseService.getDoc<'tenants/{tenantId}/groups'>('groups', audience.targetId, tenantId);

                // If specific group not in Firestore, sync it
                if (!group && bots.length > 0) {
                    const activeBot = multiTenantBotService.getBotSocket(bots[0].id);
                    if (activeBot) {
                        logger.info(`Group ${audience.targetId} missing from Firestore. Syncing...`);
                        await groupService.syncGroup(activeBot, audience.targetId);
                        group = await firebaseService.getDoc<'tenants/{tenantId}/groups'>('groups', audience.targetId, tenantId);
                    }
                }

                if (!group) return [];
                return [{
                    id: group.id,
                    tenantId,
                    name: (group as any).subject || (group as any).name || 'Unknown Group',
                    phone: group.id, // JID
                    tags: [],
                    status: 'active' as const,
                    createdAt: new Date(),
                    updatedAt: new Date()
                } as Contact];
            }
        }

        if (audience.type === 'contacts') {
            const allContacts = await firebaseService.getCollection<'tenants/{tenantId}/contacts'>('contacts', tenantId);
            return allContacts;
        }

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
