import { firebaseService } from '@/services/FirebaseService.js';
import logger from '@/utils/logger.js';
import { 
  ModerationItem, 
  ModerationItemSchema, 
  Violation, 
  ViolationSchema, 
  Result 
} from '@/types/index.js';
import { Timestamp } from 'firebase-admin/firestore';

export class ModerationService {
  private static instance: ModerationService;

  private constructor() {}

  public static getInstance(): ModerationService {
    if (!ModerationService.instance) {
      ModerationService.instance = new ModerationService();
    }
    return ModerationService.instance;
  }

  /**
   * Get moderation queue for a tenant
   */
  async getModerationQueue(tenantId: string, options: { status?: string; limit?: number } = {}): Promise<Result<ModerationItem[]>> {
    try {
      // In current FirebaseService, we'd need a listDocs method. 
      // For now, using a placeholder until FirebaseService is enhanced.
      return { success: true, data: [] };
    } catch (error: unknown) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error(`Moderation.getQueue error [${tenantId}]:`, err);
      return { success: false, error: err };
    }
  }

  /**
   * Add item to moderation queue
   */
  async queueItem(tenantId: string, itemData: Partial<ModerationItem>): Promise<Result<ModerationItem>> {
    try {
      const id = `mod_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      const rawData = {
        id,
        tenantId,
        contentType: itemData.contentType || 'text',
        content: itemData.content || '',
        status: 'pending' as const,
        priority: itemData.priority || 'medium',
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        ...itemData
      };

      const data = ModerationItemSchema.parse(rawData);
      await firebaseService.setDoc<'tenants/{tenantId}/moderation'>('moderation', id, data, tenantId);
      
      return { success: true, data };
    } catch (error: unknown) {
      const err = error instanceof Error ? error : new Error(String(error));
      return { success: false, error: err };
    }
  }

  /**
   * Add a user violation
   */
  async addViolation(tenantId: string, userId: string, violationData: Partial<Violation>): Promise<Result<Violation>> {
    try {
      const id = `viol_${Date.now()}`;
      const rawData = {
        id,
        userId,
        tenantId,
        type: violationData.type || 'unknown',
        severity: violationData.severity || 'MEDIUM',
        description: violationData.description || '',
        timestamp: Timestamp.now(),
        ...violationData
      };

      const data = ViolationSchema.parse(rawData);
      await firebaseService.setDoc<'tenants/{tenantId}/violations'>('violations', id, data, tenantId);
      
      return { success: true, data };
    } catch (error: unknown) {
      const err = error instanceof Error ? error : new Error(String(error));
      return { success: false, error: err };
    }
  }

  /**
   * Get user violations
   */
  async getUserViolations(tenantId: string, userId: string): Promise<Result<Violation[]>> {
    try {
      // Placeholder for subcollection query
      return { success: true, data: [] };
    } catch (error: unknown) {
      const err = error instanceof Error ? error : new Error(String(error));
      return { success: false, error: err };
    }
  }
}

export const moderationService = ModerationService.getInstance();
export default moderationService;