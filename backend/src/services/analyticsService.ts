import { firebaseService } from './FirebaseService.js';
import { AnalyticsData } from '../types/contracts.js';
import logger from '../utils/logger.js';
import { FieldValue } from 'firebase-admin/firestore';

export class AnalyticsService {
  private static instance: AnalyticsService;

  private constructor() {}

  public static getInstance(): AnalyticsService {
    if (!AnalyticsService.instance) {
      AnalyticsService.instance = new AnalyticsService();
    }
    return AnalyticsService.instance;
  }

  /**
   * Track an event and increment daily stats
   */
  public async trackEvent(tenantId: string, type: 'sent' | 'received'): Promise<void> {
    try {
      const today = new Date().toISOString().split('T')[0];
      const analyticsRef = `tenants/${tenantId}/analytics`;

      const updateData: any = {
        updatedAt: new Date()
      };
      updateData[type] = FieldValue.increment(1);

      // We use setDoc with merge: true to either create or update today's record
      await firebaseService.setDoc<'tenants/{tenantId}/analytics'>(
        'analytics',
        today,
        {
          id: today,
          ...updateData
        } as any,
        tenantId,
        true
      );
    } catch (error) {
      logger.error('AnalyticsService.trackEvent error', error);
    }
  }

  /**
   * Get stats for the last N days
   */
  public async getDailyStats(tenantId: string, days: number = 7): Promise<AnalyticsData[]> {
    try {
      const stats = await firebaseService.getCollection<'tenants/{tenantId}/analytics'>('analytics', tenantId);
      return stats
        .sort((a, b) => a.id.localeCompare(b.id))
        .slice(-days);
    } catch (error) {
      logger.error('AnalyticsService.getDailyStats error', error);
      return [];
    }
  }
}

export const analyticsService = AnalyticsService.getInstance();
