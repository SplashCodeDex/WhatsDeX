import { Job } from 'bullmq';
import { firebaseService } from '../services/FirebaseService.js';
import { db, admin } from '../lib/firebase.js';
import logger from '../utils/logger.js';
import { Timestamp } from 'firebase-admin/firestore';
import { AnalyticsData } from '../types/contracts.js';

/**
 * StatsAggregatorJob - Background worker for daily usage rollups.
 * Processes 'command_usage' logs for all tenants and aggregates them into daily 'analytics' documents.
 */
class StatsAggregatorJob {

  /**
   * Main handler for the aggregator job
   */
  async handle(job: Job): Promise<any> {
    try {
      logger.info('Starting daily stats aggregation job');

      // 1. Fetch all tenants
      const tenants = await firebaseService.getCollection('tenants') as any[];
      const results = [];

      for (const tenant of tenants) {
        try {
          const tenantId = tenant.id;
          const tenantResult = await this.aggregateForTenant(tenantId);
          results.push({ tenantId, ...tenantResult });
        } catch (error: any) {
          logger.error(`Aggregation failed for tenant ${tenant.id}:`, error);
          results.push({ tenantId: tenant.id, success: false, error: error.message });
        }
      }

      logger.info('Stats aggregation completed', { totalTenants: tenants.length });
      return { success: true, results };
    } catch (error: any) {
      logger.error('StatsAggregatorJob failed:', error);
      throw error;
    }
  }

  /**
   * Aggregate stats for a specific tenant for the previous day
   */
  private async aggregateForTenant(tenantId: string) {
    // We aggregate for "yesterday"
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const dateStr = yesterday.toISOString().split('T')[0];

    const startOfDay = new Date(yesterday.setHours(0, 0, 0, 0));
    const endOfDay = new Date(yesterday.setHours(23, 59, 59, 999));

    const tenantPath = `tenants/${tenantId}`;

    // 1. Query command_usage for this tenant
    const usageSnapshot = await db.collection(`${tenantPath}/command_usage`)
      .where('usedAt', '>=', Timestamp.fromDate(startOfDay))
      .where('usedAt', '<=', Timestamp.fromDate(endOfDay))
      .get();

    const totalCommands = usageSnapshot.size;
    let aiRequests = 0;
    let errors = 0;

    usageSnapshot.forEach(doc => {
      const data = doc.data();
      if (data.category === 'ai-chat') aiRequests++;
      if (data.success === false) errors++;
    });

    // 2. Fetch existing daily stats (which might have message counts from analyticsService.trackMessage)
    const existingStats = await firebaseService.getDoc<'tenants/{tenantId}/analytics'>(
      'analytics',
      dateStr,
      tenantId
    );

    // 3. Prepare update data
    const analyticsUpdate: Partial<AnalyticsData> = {
      date: dateStr,
      // Total commands for the day
      ...({ totalCommands } as any),
      aiRequests: aiRequests,
      errors: (existingStats?.errors || 0) + errors,
      updatedAt: new Date()
    };

    // 4. Save/Update daily analytics document
    await firebaseService.setDoc<'tenants/{tenantId}/analytics'>(
      'analytics',
      dateStr,
      analyticsUpdate,
      tenantId,
      true
    );

    logger.debug(`Aggregated stats for ${tenantId} on ${dateStr}`, { totalCommands, aiRequests });

    return { success: true, date: dateStr, totalCommands, aiRequests };
  }
}

export default new StatsAggregatorJob();
