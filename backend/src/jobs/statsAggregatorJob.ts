import { Job } from 'bull';
import { db } from '../lib/firebase.js';
import { firebaseService } from '../services/FirebaseService.js';
import logger from '../utils/logger.js';
import { Timestamp } from 'firebase-admin/firestore';

/**
 * StatsAggregatorJob - Aggregates daily usage statistics for all tenants
 */
export class StatsAggregatorJob {
  /**
   * Process the aggregation job
   */
  async process(job: Job) {
    const { date } = job.data;
    const targetDate = date ? new Date(date) : new Date();

    // If no date provided, we aggregate for yesterday by default
    if (!date) {
      targetDate.setDate(targetDate.getDate() - 1);
    }

    const dateStr = targetDate.toISOString().split('T')[0];
    logger.info(`Starting stats aggregation for date: ${dateStr}`);

    try {
      const tenantsSnapshot = await db.collection('tenants').get();
      logger.info(`Found ${tenantsSnapshot.size} tenants to process`);

      let processedCount = 0;
      for (const tenantDoc of tenantsSnapshot.docs) {
        const tenantId = tenantDoc.id;
        try {
          await this.aggregateForTenant(tenantId, targetDate);
          processedCount++;

          // Update job progress
          await job.progress((processedCount / tenantsSnapshot.size) * 100);
        } catch (error) {
          logger.error(`Failed to aggregate stats for tenant ${tenantId}`, { error });
        }
      }

      logger.info(`Stats aggregation completed for ${processedCount} tenants`);
      return { success: true, date: dateStr, processedTenants: processedCount };
    } catch (error) {
      logger.error('Stats aggregation job failed', { error });
      throw error;
    }
  }

  /**
   * Aggregate statistics for a single tenant
   */
  private async aggregateForTenant(tenantId: string, date: Date) {
    const dateStr = date.toISOString().split('T')[0];

    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const tenantPath = `tenants/${tenantId}`;

    // 1. Aggregate command usage from 'command_usage' subcollection
    const commandUsageRef = db.collection(`${tenantPath}/command_usage`);

    const totalCommands = (await commandUsageRef
      .where('usedAt', '>=', Timestamp.fromDate(startOfDay))
      .where('usedAt', '<=', Timestamp.fromDate(endOfDay))
      .count().get()).data().count;

    const aiRequests = (await commandUsageRef
      .where('usedAt', '>=', Timestamp.fromDate(startOfDay))
      .where('usedAt', '<=', Timestamp.fromDate(endOfDay))
      .where('category', '==', 'ai-chat')
      .count().get()).data().count;

    // 2. Update the daily analytics document
    // We use merge: true because 'sent', 'received', and 'errors' are tracked in real-time
    await firebaseService.setDoc<'tenants/{tenantId}/analytics'>(
      'analytics',
      dateStr,
      {
        date: dateStr,
        totalCommands,
        aiRequests,
        updatedAt: new Date()
      } as any,
      tenantId,
      true
    );

    logger.debug(`Aggregated stats for tenant ${tenantId} [${dateStr}]: Commands: ${totalCommands}, AI: ${aiRequests}`);
  }
}

export default StatsAggregatorJob;
