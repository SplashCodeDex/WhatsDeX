import { Worker, Job } from 'bullmq';
import { firebaseService } from '../services/FirebaseService.js';
import { db } from '../lib/firebase.js';
import logger from '../utils/logger.js';
import { Timestamp } from 'firebase-admin/firestore';

const redisOptions = {
    host: process.env.REDIS_HOST || 'localhost',
    port: Number(process.env.REDIS_PORT) || 6379,
    password: process.env.REDIS_PASSWORD,
    maxRetriesPerRequest: null,
};

/**
 * StatsAggregatorJob
 * Rolls up daily statistics for all tenants.
 */
class StatsAggregatorJob {
    private worker: Worker;

    constructor() {
        this.worker = new Worker(
            'analytics',
            async (job: Job) => {
                try {
                    await this.performRollup(job);
                } catch (error) {
                    logger.error(`Error in StatsAggregatorJob [${job.id}]:`, error);
                    throw error;
                }
            },
            {
                connection: redisOptions,
                concurrency: 1
            } as any
        );

        this.worker.on('completed', (job) => {
            logger.info(`Stats Aggregator Job ${job.id} completed`);
        });

        this.worker.on('failed', (job, err) => {
            logger.error(`Stats Aggregator Job ${job?.id} failed:`, err);
        });

        logger.info('StatsAggregatorJob initialized');
    }

    private async performRollup(job: Job): Promise<void> {
        const { tenantId, date } = job.data || {};

        // If date is provided, aggregate for that date (YYYY-MM-DD), otherwise previous day
        const targetDateStr = date || this.getYesterdayISO();

        let tenantsToProcess: string[] = [];
        if (tenantId) {
            tenantsToProcess = [tenantId];
        } else {
            const tenantsSnapshot = await db.collection('tenants').get();
            tenantsToProcess = tenantsSnapshot.docs.map(doc => doc.id);
        }

        logger.info(`Starting stats rollup for ${tenantsToProcess.length} tenants for date: ${targetDateStr}`);

        for (const tId of tenantsToProcess) {
            try {
                await this.aggregateForTenant(tId, targetDateStr);
            } catch (error) {
                logger.error(`Failed to aggregate stats for tenant ${tId} on ${targetDateStr}`, error);
            }
        }
    }

    private async aggregateForTenant(tenantId: string, dateStr: string): Promise<void> {
        const startOfDay = new Date(dateStr + 'T00:00:00Z');
        const endOfDay = new Date(dateStr + 'T23:59:59Z');

        const startTimestamp = Timestamp.fromDate(startOfDay);
        const endTimestamp = Timestamp.fromDate(endOfDay);

        // 1. Aggregate command_usage
        const commandUsageRef = db.collection(`tenants/${tenantId}/command_usage`);
        const snapshot = await commandUsageRef
            .where('usedAt', '>=', startTimestamp)
            .where('usedAt', '<=', endTimestamp)
            .get();

        let totalCommands = 0;
        let aiRequests = 0;

        snapshot.forEach(doc => {
            const data = doc.data();
            totalCommands++;
            // Basic categorization
            if (data.category === 'ai-chat' || data.category === 'ai-image' || data.command === 'gemini') {
                aiRequests++;
            }
        });

        // 2. Update Analytics Document
        // We merge these with existing message stats (sent/received/errors)
        await firebaseService.setDoc<'tenants/{tenantId}/analytics'>(
            'analytics',
            dateStr,
            {
                date: dateStr,
                totalCommands,
                aiRequests,
                updatedAt: new Date()
            },
            tenantId,
            true
        );
    }

    private getYesterdayISO(): string {
        const date = new Date();
        date.setDate(date.getDate() - 1);
        return date.toISOString().split('T')[0];
    }
}

export const statsAggregatorJob = new StatsAggregatorJob();
export default statsAggregatorJob;
