import { db, admin } from '../lib/firebase.js';
import logger from '../utils/logger.js';
import { Timestamp } from 'firebase-admin/firestore';

class PlanService {
  private planCache: Map<string, any>;

  constructor() {
    this.planCache = new Map();
  }

  async getTenantPlan(tenantId: string) {
    try {
      if (!tenantId) {
        return await this.getDefaultFreePlan();
      }

      // Root tenants collection holds primary plan data for quick access
      const tenantDoc = await db.collection('tenants').doc(tenantId).get();

      if (!tenantDoc.exists) {
        return await this.getDefaultFreePlan();
      }

      const tenantData = tenantDoc.data();
      
      // If plan data is already in the tenant root (cached/denormalized), use it
      if (tenantData?.planTier) {
          // Fetch plan details from global root plans
          return await this.getPlanDetails(tenantData.planTier.toUpperCase());
      }

      return await this.getDefaultFreePlan();

    } catch (error: any) {
      logger.error('Failed to get tenant plan:', error);
      return await this.getDefaultFreePlan();
    }
  }

  async getPlanDetails(planCode: string) {
    const cacheKey = `PLAN:${planCode}`;
    if (this.planCache.has(cacheKey)) {
        return this.planCache.get(cacheKey);
    }

    try {
        const snapshot = await db.collection('plans').where('code', '==', planCode).limit(1).get();
        if (!snapshot.empty) {
            const plan = { ...snapshot.docs[0].data(), id: snapshot.docs[0].id };
            this.planCache.set(cacheKey, plan);
            return plan;
        }
        return null;
    } catch (e) {
        return null;
    }
  }

  async getDefaultFreePlan() {
    return this.getPlanDetails('FREE') || {
        code: 'FREE',
        name: 'Free Plan',
        maxBots: 1,
        enableAIChat: true,
        messagesPerDay: 100
    };
  }

  async checkEntitlement(tenantId: string, featureKey: string) {
    try {
      const plan = await this.getTenantPlan(tenantId);

      switch (featureKey) {
        case 'aiChat':
          return plan.enableAIChat || plan.aiType !== 'none';
        case 'rag':
          return plan.enableRAG || plan.aiType === 'advanced';
        case 'video':
          return plan.enableVideo;
        case 'imageGen':
          return plan.enableImageGen;
        case 'advancedTools':
          return plan.enableAdvancedTools;
        default:
          return false;
      }
    } catch (error: any) {
      logger.error('Failed to check entitlement:', error);
      return false;
    }
  }

  async checkUsageLimit(tenantId: string, limitType: string) {
    try {
      const plan = await this.getTenantPlan(tenantId);
      const currentPeriod = new Date().toISOString().slice(0, 7); // YYYY-MM
      
      // Scoped to tenant subcollection (Rule 3)
      const usageDoc = await db.collection('tenants').doc(tenantId).collection('usage_counters').doc(currentPeriod).get();
      const currentUsage = usageDoc.exists ? usageDoc.data() : { aiRequests: 0, messages: 0, mediaGens: 0 };

      const aiRequests = currentUsage?.aiRequests || 0;
      const messages = currentUsage?.messages || 0;
      const mediaGens = currentUsage?.mediaGens || 0;

      switch (limitType) {
        case 'aiRequests':
          const aiLimit = plan.aiRequestsPerMonth || 10;
          return {
            allowed: aiLimit === -1 || aiRequests < aiLimit,
            current: aiRequests,
            limit: aiLimit,
            remaining: aiLimit === -1 ? 999999 : Math.max(0, aiLimit - aiRequests)
          };
        case 'messages':
          const messageLimit = (plan.messagesPerDay || 100) * 30;
          return {
            allowed: messages < messageLimit,
            current: messages,
            limit: messageLimit,
            remaining: Math.max(0, messageLimit - messages)
          };
        default:
          return { allowed: false, current: 0, limit: 0, remaining: 0 };
      }
    } catch (error: any) {
      logger.error('Failed to check usage limit:', error);
      return { allowed: false, current: 0, limit: 0, remaining: 0 };
    }
  }

  async incrementUsage(tenantId: string, counterKey: string, amount = 1) {
    try {
      const currentPeriod = new Date().toISOString().slice(0, 7);
      // Scoped to tenant subcollection (Rule 3)
      const usageRef = db.collection('tenants').doc(tenantId).collection('usage_counters').doc(currentPeriod);

      await usageRef.set({
        period: currentPeriod,
        [counterKey]: admin.firestore.FieldValue.increment(amount),
        updatedAt: Timestamp.now()
      }, { merge: true });

    } catch (error: any) {
      logger.error('Failed to increment usage:', error);
    }
  }

  async updateTenantSubscription(tenantId: string, planCode: string, stripeSubscriptionId: string, status: string, currentPeriodStart: Date, currentPeriodEnd: Date) {
    try {
      const plan = await this.getPlanDetails(planCode.toUpperCase());
      if (!plan) throw new Error(`Plan not found: ${planCode}`);

      // 1. Update Tenant Root (Primary State)
      await db.collection('tenants').doc(tenantId).update({
        planTier: planCode.toLowerCase(),
        subscriptionStatus: status,
        stripeSubscriptionId,
        updatedAt: Timestamp.now()
      });

      // 2. Update Subcollection (Audit/History) - Rule 3
      const subRef = db.collection('tenants').doc(tenantId).collection('subscriptions').doc(stripeSubscriptionId);
      const subscriptionData = {
        planId: plan.id,
        status,
        stripeSubscriptionId,
        currentPeriodStart: Timestamp.fromDate(new Date(currentPeriodStart)),
        currentPeriodEnd: Timestamp.fromDate(new Date(currentPeriodEnd)),
        updatedAt: Timestamp.now()
      };

      await subRef.set(subscriptionData, { merge: true });
      this.planCache.delete(tenantId);

      return { success: true, data: subscriptionData };
    } catch (error: any) {
      logger.error('Failed to update tenant subscription:', error);
      throw error;
    }
  }
}

export default new PlanService();