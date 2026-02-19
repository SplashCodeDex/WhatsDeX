import { Queue } from 'bullmq';
import { Campaign } from '../types/contracts.js';
import logger from '../utils/logger.js';
import { Redis } from 'ioredis';

// Redis connection options
const redisOptions = {
    host: process.env.REDIS_HOST || 'localhost',
    port: Number(process.env.REDIS_PORT) || 6379,
    password: process.env.REDIS_PASSWORD,
    maxRetriesPerRequest: null, // Required for BullMQ
};

// Reuse Redis connection if needed, though BullMQ manages its own
// ideally we pass a connection object to BullMQ

/**
 * QueueService
 * Manages BullMQ queues for the application
 */
class QueueService {
    private campaignQueue: any;
    private analyticsQueue: any;

    constructor() {
        this.campaignQueue = new Queue('campaigns', {
            connection: redisOptions,
            defaultJobOptions: {
                attempts: 3,
                backoff: {
                    type: 'exponential',
                    delay: 1000,
                },
                removeOnComplete: true, // Keep DB clean
                removeOnFail: false,   // Keep failed jobs for debugging
            },
        });

        this.analyticsQueue = new Queue('analytics', {
            connection: redisOptions,
            defaultJobOptions: {
                attempts: 3,
                backoff: {
                    type: 'exponential',
                    delay: 5000,
                },
                removeOnComplete: true,
            },
        });

        // Schedule daily rollup at 01:00 AM
        this.scheduleDailyRollup();

        logger.info('QueueService initialized: campaigns, analytics');
    }

    /**
     * Schedule daily stats rollup
     */
    private async scheduleDailyRollup() {
        try {
            await this.analyticsQueue.add(
                'daily-rollup',
                {},
                {
                    repeat: { pattern: '0 1 * * *' },
                    jobId: 'daily_stats_rollup'
                }
            );
            logger.info('Daily stats rollup scheduled for 01:00 AM');
        } catch (error) {
            logger.error('Failed to schedule daily stats rollup', error);
        }
    }

    /**
     * Add a campaign to the processing queue
     */
    async addCampaignJob(tenantId: string, campaign: Campaign, options: any = {}): Promise<void> {
        try {
            await this.campaignQueue.add(
                'process-campaign',
                { tenantId, campaign },
                {
                    jobId: `camp_${campaign.id}`, // Deduplication
                    ...options
                }
            );
            logger.info(`Added campaign to queue: ${campaign.id} (Tenant: ${tenantId})`);
        } catch (error) {
            logger.error(`Failed to add campaign to queue: ${campaign.id}`, error);
            throw error;
        }
    }

    /**
     * Gracefully close queues
     */
    async close(): Promise<void> {
        await this.campaignQueue.close();
        await this.analyticsQueue.close();
    }
}

export const queueService = new QueueService();
