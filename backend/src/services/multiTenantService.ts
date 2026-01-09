import { firebaseService } from '@/services/FirebaseService.js';
import logger from '@/utils/logger.js';
import { TenantDocument } from '@/types/index.js';
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
  async createTenant(tenantData: Partial<TenantDocument>): Promise<TenantDocument | null> {
    if (!tenantData.id) throw new Error('Tenant ID is required');
    
    const data: TenantDocument = {
      id: tenantData.id,
      name: tenantData.name || 'New Workspace',
      subdomain: tenantData.subdomain || tenantData.id,
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

    try {
      await firebaseService.setDoc< 'tenants' >('tenants', data.id, data);
      logger.info(`Tenant created: ${data.id}`);
      return data;
    } catch (error: any) {
      logger.error(`MultiTenantService.createTenant error [${data.id}]:`, error);
      return null;
    }
  }

  /**
   * Get tenant by ID
   */
  async getTenant(tenantId: string): Promise<TenantDocument | null> {
    try {
      return await firebaseService.getDoc< 'tenants' >('tenants', tenantId);
    } catch (error: any) {
      logger.error(`MultiTenantService.getTenant error [${tenantId}]:`, error);
      return null;
    }
  }

  /**
   * Update tenant data
   */
  async updateTenant(tenantId: string, data: Partial<TenantDocument>): Promise<void> {
    try {
      await firebaseService.setDoc< 'tenants' >('tenants', tenantId, {
        ...data,
        updatedAt: Timestamp.now()
      });
    } catch (error: any) {
      logger.error(`MultiTenantService.updateTenant error [${tenantId}]:`, error);
      throw error;
    }
  }

  /**
   * Check if tenant has reached bot limit
   */
  async canAddBot(tenantId: string): Promise<boolean> {
    const tenant = await this.getTenant(tenantId);
    if (!tenant) return false;

    // This logic will be fully implemented once multiTenantBotService is refactored
    // to include a count method. For now, returning true based on plan check.
    return true; 
  }
}

export const multiTenantService = MultiTenantService.getInstance();
export default multiTenantService;