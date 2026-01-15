import { firebaseService } from '@/services/FirebaseService.js';
import logger from '@/utils/logger.js';
import { Tenant, TenantSchema, Result } from '@/types/index.js';
import { Timestamp } from 'firebase-admin/firestore';
import { getPlanLimits } from '@/utils/featureGating.js';

export class MultiTenantService {
  private static instance: MultiTenantService;

  private constructor() { }

  public static getInstance(): MultiTenantService {
    if (!MultiTenantService.instance) {
      MultiTenantService.instance = new MultiTenantService();
    }
    return MultiTenantService.instance;
  }

  /**
   * Create a new tenant
   */
  async createTenant(tenantData: Partial<Tenant>): Promise<Result<Tenant>> {
    if (!tenantData.id) {
      return { success: false, error: new Error('Tenant ID is required') };
    }

    try {
      const plan = tenantData.plan || 'starter';
      const limits = getPlanLimits(plan);
      const maxBots = limits.maxBots;
      
      const rawData = {
        id: tenantData.id,
        name: tenantData.name || 'New Workspace',
        subdomain: (tenantData.subdomain || tenantData.id).toLowerCase(),
        plan: plan,
        planTier: plan,
        subscriptionStatus: 'trialing',
        status: 'active',
        ownerId: tenantData.ownerId || '',
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        trialEndsAt: Timestamp.fromDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)), // 7 days trial
        settings: {
          maxBots: maxBots,
          aiEnabled: plan !== 'starter',
          timezone: 'UTC',
          ...tenantData.settings
        }
      };

      // Zero-Trust Validation before write
      const data = TenantSchema.parse(rawData);

      await firebaseService.setDoc('tenants', data.id, data);
      logger.info(`Tenant created: ${data.id}`);
      return { success: true, data };
    } catch (error: unknown) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error(`MultiTenantService.createTenant error [${tenantData.id}]:`, err);
      return { success: false, error: err };
    }
  }

  /**
   * Get tenant by ID
   */
  async getTenant(tenantId: string): Promise<Result<Tenant>> {
    try {
      const doc = await firebaseService.getDoc('tenants', tenantId);
      if (!doc) {
        return { success: false, error: new Error(`Tenant not found: ${tenantId}`) };
      }

      // Zero-Trust Validation on read
      const data = TenantSchema.parse(doc);
      return { success: true, data };
    } catch (error: unknown) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error(`MultiTenantService.getTenant error [${tenantId}]:`, err);
      return { success: false, error: err };
    }
  }

  /**
   * Update tenant data
   */
  async updateTenant(tenantId: string, updates: Partial<Tenant>): Promise<Result<void>> {
    try {
      const result = await this.getTenant(tenantId);
      if (!result.success) return result as Result<never>;

      const updatedData = {
        ...result.data,
        ...updates,
        updatedAt: Timestamp.now()
      };

      // Validation
      const validated = TenantSchema.parse(updatedData);

      await firebaseService.setDoc('tenants', tenantId, validated);
      return { success: true, data: undefined };
    } catch (error: unknown) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error(`MultiTenantService.updateTenant error [${tenantId}]:`, err);
      return { success: false, error: err };
    }
  }

  /**
   * Check if tenant has reached bot limit
   */
  /**
   * Check if tenant has reached bot limit
   */
  async canAddBot(tenantId: string): Promise<Result<boolean>> {
    const tenantResult = await this.getTenant(tenantId);
    if (!tenantResult.success) {
      logger.error(`MultiTenantService.canAddBot failed to get tenant [${tenantId}]:`, tenantResult.error);
      return tenantResult as Result<never>;
    }

    const tenant = tenantResult.data;
    const plan = tenant.planTier || 'starter';
    const limits = getPlanLimits(plan);
    const maxBots = limits.maxBots;

    try {
      // Get all bots for this tenant
      const botDocs = await firebaseService.getCollection('bots' as any, tenantId);
      const currentBotCount = botDocs.length;

      if (currentBotCount >= maxBots) {
        return {
          success: true,
          data: false
        };
      }

      return { success: true, data: true };
    } catch (error) {
      logger.error(`MultiTenantService.canAddBot failed to count bots [${tenantId}]:`, error);
      return { success: false, error: error as Error };
    }
  }

  /**
   * List all tenants (Admin only)
   */
  async listTenants(): Promise<Tenant[]> {
    try {
      const snapshot = await firebaseService.getCollection('tenants');
      return snapshot.map(doc => TenantSchema.parse(doc));
    } catch (error) {
      logger.error('MultiTenantService.listTenants error:', error);
      return [];
    }
  }
}

export const multiTenantService = MultiTenantService.getInstance();
export default multiTenantService;
