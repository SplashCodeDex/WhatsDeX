import { firebaseService } from '@/services/FirebaseService.js';
import logger from '@/utils/logger.js';
import { Tenant, TenantSchema, Result } from '@/types/index.js';
import { Timestamp } from 'firebase-admin/firestore';

export class MultiTenantService {
  private static instance: MultiTenantService;

  private constructor() {}

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
      const rawData = {
        id: tenantData.id,
        name: tenantData.name || 'New Workspace',
        subdomain: (tenantData.subdomain || tenantData.id).toLowerCase(),
        plan: tenantData.plan || 'free',
        status: 'active',
        ownerId: tenantData.ownerId || '',
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        settings: {
          maxBots: tenantData.plan === 'premium' ? 2 : 1,
          aiEnabled: tenantData.plan !== 'free',
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
  async canAddBot(tenantId: string): Promise<Result<boolean>> {
    const result = await this.getTenant(tenantId);
    if (!result.success) return result as Result<never>;

    // Placeholder: This will be fully implemented once multiTenantBotService is refactored
    return { success: true, data: true }; 
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
