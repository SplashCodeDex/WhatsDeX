import { Job } from 'bullmq';
import { db } from '../lib/firebase.js';
import { firebaseService } from '../services/FirebaseService.js';
import logger from '../utils/logger.js';
import { Timestamp } from 'firebase-admin/firestore';
import admin from 'firebase-admin';

/**
 * StatsAggregatorJob
 * Daily background job to aggregate tenant-level metrics.
 */
class StatsAggregatorJob {
    /**
     * Aggregates command_usage into daily analytics documents
     */
    async aggregateStats(job: Job): Promise<any> {
        const { date } = job.data;
        const targetDate = date ? new Date(date) : new Date(Date.now() - 24 * 60 * 60 * 1000);
        const dateStr = targetDate.toISOString().split('T')[0];

        logger.info(`Starting daily stats aggregation for ${dateStr}`);

        try {
            // 1. Get all tenants
            const tenantsSnapshot = await db.collection('tenants').get();
            const tenantIds = tenantsSnapshot.docs.map(doc => doc.id);

            const results = [];

            for (const tenantId of tenantIds) {
                try {
                    const stats = await this.aggregateTenantStats(tenantId, targetDate);

                    // 2. Store in analytics collection
                    await firebaseService.setDoc<'tenants/{tenantId}/analytics'>(
                        'analytics',
                        dateStr,
                        {
                            date: dateStr,
                            sent: stats.sent,
                            received: stats.received,
                            errors: stats.errors,
                            updatedAt: new Date()
                        },
                        tenantId,
                        true
                    );

                    results.push({ tenantId, success: true });
                } catch (tenantError) {
                    logger.error(`Failed to aggregate stats for tenant ${tenantId}`, tenantError);
                    results.push({ tenantId, success: false, error: String(tenantError) });
                }
            }

            return {
                date: dateStr,
                totalTenants: tenantIds.length,
                processed: results.length,
                successful: results.filter(r => r.success).length
            };
        } catch (error) {
            logger.error('StatsAggregatorJob failed', error);
            throw error;
        }
    }

    private async aggregateTenantStats(tenantId: string, targetDate: Date) {
        const startOfDay = new Date(targetDate);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(targetDate);
        endOfDay.setHours(23, 59, 59, 999);

        const commandUsageRef = db.collection(`tenants/${tenantId}/command_usage`);

        // Count sent messages
        const sentSnapshot = await commandUsageRef
            .where('category', '==', 'message-sent')
            .where('usedAt', '>=', Timestamp.fromDate(startOfDay))
            .where('usedAt', '<=', Timestamp.fromDate(endOfDay))
            .count()
            .get();

        // Count received messages (simulated or tracked via events)
        const receivedSnapshot = await commandUsageRef
            .where('category', '==', 'message-received')
            .where('usedAt', '>=', Timestamp.fromDate(startOfDay))
            .where('usedAt', '<=', Timestamp.fromDate(endOfDay))
            .count()
            .get();

        // Count errors
        const errorSnapshot = await commandUsageRef
            .where('success', '==', false)
            .where('usedAt', '>=', Timestamp.fromDate(startOfDay))
            .where('usedAt', '<=', Timestamp.fromDate(endOfDay))
            .count()
            .get();

        return {
            sent: sentSnapshot.data().count,
            received: receivedSnapshot.data().count,
            errors: errorSnapshot.data().count
        };
    }
}

export default new StatsAggregatorJob();
