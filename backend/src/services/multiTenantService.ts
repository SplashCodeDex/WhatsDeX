import { firebaseService } from '@/services/FirebaseService.js';
import logger from '@/utils/logger.js';
import { Tenant, TenantSchema, Result } from '@/types/index.js';
import { Timestamp } from 'firebase-admin/firestore';
import { getPlanLimits } from '@/utils/featureGating.js';
import { db, admin } from '../lib/firebase.js';
import { stripeService } from './stripe.js';
import Stripe from 'stripe';

interface TenantData {
    id: string;
    name: string;
    subdomain: string;
    plan: 'FREE' | 'BASIC' | 'PRO' | 'ENTERPRISE';
    createdAt: Date;
    updatedAt: Date;
    status: string;
    settings: {
        theme: string;
        notifications: boolean;
    };
}

interface UserData {
    id: string;
    email: string;
    displayName: string;
    tenantId: string;
    role: string;
    createdAt: Date;
    updatedAt: Date;
    status: string;
}

export class MultiTenantService {
    // ... (existing methods)

    async createNewTenantWithUser(creationData: {
        tenantName: string;
        subdomain: string;
        plan: 'FREE' | 'BASIC' | 'PRO' | 'ENTERPRISE';
        user: {
            displayName: string;
            email: string;
            password: string;
        };
    }): Promise<Result<{ tenant: TenantData; user: UserData }>> {
        const { tenantName, subdomain, plan, user } = creationData;
        const { displayName, email, password } = user;

        try {
            const result = await db.runTransaction(async (transaction) => {
                // 1. Create Tenant
                const tenantId = `tenant-${Date.now()}`;
                const tenantRef = db.collection('tenants').doc(tenantId);

                const tenantData: TenantData = {
                    id: tenantId,
                    name: tenantName,
                    subdomain: subdomain,
                    plan,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    status: 'ACTIVE',
                    settings: {
                        theme: 'light',
                        notifications: true,
                    },
                };
                transaction.set(tenantRef, tenantData);

                // 2. Create Firebase Auth User
                const userRecord = await admin.auth().createUser({
                    email,
                    password,
                    displayName,
                });

                // 3. Create User Document
                const userRef = db.collection('tenant_users').doc(userRecord.uid);
                const userData: UserData = {
                    id: userRecord.uid,
                    email,
                    displayName,
                    tenantId,
                    role: 'ADMIN',
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    status: 'ACTIVE',
                };
                transaction.set(userRef, userData);

                // 4. Handle Plan and Subscription
                const planCode = plan.toUpperCase();
                const plansSnapshot = await db.collection('plans').where('code', '==', planCode).limit(1).get();
                const planDoc = plansSnapshot.docs[0];

                if (planDoc) {
                    const planData = planDoc.data();
                    let stripeSubscriptionId = `free_${Date.now()}`;
                    let stripePriceId = 'FREE';

                    if (planData.code !== 'FREE') {
                        const customer = await stripeService.createCustomer({ userId: userRecord.uid, email, name: displayName, phone: undefined });
                        const planKey = planData.code.toLowerCase();
                        const subscription: Stripe.Subscription = await stripeService.createSubscription(customer.id, planKey, { userId: userRecord.uid });
                        stripeSubscriptionId = subscription.id;
                        const price = subscription.items.data[0].price;
                        stripePriceId = price.id;
                    }

                    const subRef = db.collection('tenant_subscriptions').doc();
                    transaction.set(subRef, {
                        id: subRef.id,
                        tenantId: tenantData.id,
                        planId: planDoc.id,
                        status: planData.code === 'FREE' ? 'active' : 'trialing',
                        currentPeriodStart: Timestamp.now(),
                        currentPeriodEnd: Timestamp.fromDate(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)),
                        stripeSubscriptionId,
                        stripePriceId,
                        createdAt: Timestamp.now(),
                        updatedAt: Timestamp.now(),
                    });
                }

                return { tenant: tenantData, user: userData };
            });

            return { success: true, data: result };
        } catch (error: unknown) {
            const err = error instanceof Error ? error : new Error(String(error));
            logger.error(`MultiTenantService.createNewTenantWithUser error:`, err);
            return { success: false, error: err };
        }
    }
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
