import { db, admin } from '../lib/firebase.js';
import logger from '../utils/logger.js';

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

      const subscriptionDoc = await db.collection('tenant_subscriptions').doc(tenantId).get();

      if (!subscriptionDoc.exists) {
        // Return default FREE plan
        return await this.getDefaultFreePlan();
      }

      const subscription = subscriptionDoc.data();

      // Check if subscription is active
      const now = new Date();
      // Ensure dates are parsed correctly if stored as strings or Timestamps
      const currentPeriodEnd = subscription?.currentPeriodEnd?.toDate ? subscription.currentPeriodEnd.toDate() : new Date(subscription?.currentPeriodEnd);

      if (subscription?.status !== 'active' || currentPeriodEnd < now) {
        return await this.getDefaultFreePlan();
      }

      // Fetch the actual plan details using planId or embedded plan data
      // Assuming planId is stored, fetch plan. Or if we embed, use it directly.
      // Let's assume we store planId or code and need to fetch it to be safe, or we could have embedded it.
      // Given the previous prisma include: { plan: true }, let's try to fetch the plan details.
      if (subscription?.planId) {
        const planDoc = await db.collection('plans').doc(subscription.planId).get();
        if (planDoc.exists) {
          return { ...planDoc.data(), id: planDoc.id };
        }
      }

      // Fallback if plan lookup fails
      return await this.getDefaultFreePlan();

    } catch (error: any) {
      logger.error('Failed to get tenant plan:', error);
      return await this.getDefaultFreePlan();
    }
  }

  async getDefaultFreePlan() {
    if (this.planCache.has('FREE')) {
      return this.planCache.get('FREE');
    }

    try {
      const plansSnapshot = await db.collection('plans').where('code', '==', 'FREE').limit(1).get();

      if (!plansSnapshot.empty) {
        const planDoc = plansSnapshot.docs[0];
        const plan = { ...planDoc.data(), id: planDoc.id };
        this.planCache.set('FREE', plan);
        return plan;
      }

      // Create default FREE plan if it doesn't exist
      const defaultPlanData = {
        code: 'FREE',
        name: 'Free Plan',
        description: 'Basic features with limited usage',
        price: 0,
        aiRequestsPerMonth: 10,
        messagesPerDay: 100,
        mediaGensPerDay: 0,
        maxBots: 1,
        enableRAG: false,
        enableVideo: false,
        enableAIChat: true,
        enableImageGen: false,
        enableAdvancedTools: false
      };

      // Create a new doc reference for better ID generation or use 'FREE' as ID if unique
      // Prisma used an ID. Let's let Firestore generate or use code as ID if we want.
      // To strictly match "findUnique where code", let's use the code as ID for simplicity or query.
      // Let's use auto-id but query by code as above.
      const newPlanRef = await db.collection('plans').add(defaultPlanData);

      const defaultPlan = { ...defaultPlanData, id: newPlanRef.id };
      this.planCache.set('FREE', defaultPlan);
      return defaultPlan;
    } catch (error: any) {
      logger.error('Failed to get default plan:', error);
      throw new Error('Failed to get plan information');
    }
  }

  async checkEntitlement(tenantId: string, featureKey: string) {
    try {
      const plan = await this.getTenantPlan(tenantId);

      switch (featureKey) {
        case 'aiChat':
          return plan.enableAIChat;
        case 'rag':
          return plan.enableRAG;
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
      const usageDocId = `${tenantId}_${currentPeriod}`;

      const usageDoc = await db.collection('usage_counters').doc(usageDocId).get();
      const currentUsage = usageDoc.exists ? usageDoc.data() : { aiRequests: 0, messages: 0, mediaGens: 0 };

      // Default to 0 if undefined
      const aiRequests = currentUsage?.aiRequests || 0;
      const messages = currentUsage?.messages || 0;
      const mediaGens = currentUsage?.mediaGens || 0;

      switch (limitType) {
        case 'aiRequests':
          return {
            allowed: aiRequests < plan.aiRequestsPerMonth,
            current: aiRequests,
            limit: plan.aiRequestsPerMonth,
            remaining: Math.max(0, plan.aiRequestsPerMonth - aiRequests)
          };
        case 'messages':
          // For daily limits, we'd need a more granular counter, for now use monthly implication from original code
          // Original code: allowed: currentUsage.messages < (plan.messagesPerDay * 30)
          const messageLimit = plan.messagesPerDay * 30;
          return {
            allowed: messages < messageLimit,
            current: messages,
            limit: messageLimit,
            remaining: Math.max(0, messageLimit - messages)
          };
        case 'mediaGens':
          return {
            allowed: mediaGens < plan.mediaGensPerDay,
            current: mediaGens,
            limit: plan.mediaGensPerDay,
            remaining: Math.max(0, plan.mediaGensPerDay - mediaGens)
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
      const currentPeriod = new Date().toISOString().slice(0, 7); // YYYY-MM
      const usageDocId = `${tenantId}_${currentPeriod}`;
      const usageRef = db.collection('usage_counters').doc(usageDocId);

      await usageRef.set({
        tenantId,
        period: currentPeriod,
        [counterKey]: admin.firestore.FieldValue.increment(amount)
      }, { merge: true });

      logger.debug(`Incremented ${counterKey} by ${amount} for tenant ${tenantId}`);
    } catch (error: any) {
      logger.error('Failed to increment usage:', error);
      throw new Error('Failed to update usage counter');
    }
  }

  async updateTenantSubscription(tenantId: string, planCode: string, stripeSubscriptionId: string, status: string, currentPeriodStart: Date, currentPeriodEnd: Date) {
    try {
      const plansSnapshot = await db.collection('plans').where('code', '==', planCode).limit(1).get();

      if (plansSnapshot.empty) {
        throw new Error(`Plan not found: ${planCode}`);
      }

      const planDoc = plansSnapshot.docs[0];
      const planId = planDoc.id;

      const subscriptionRef = db.collection('tenant_subscriptions').doc(tenantId);
      const subscriptionData = {
        tenantId,
        planId,
        status,
        stripeSubscriptionId,
        currentPeriodStart: admin.firestore.Timestamp.fromDate(new Date(currentPeriodStart)),
        currentPeriodEnd: admin.firestore.Timestamp.fromDate(new Date(currentPeriodEnd))
      };

      await subscriptionRef.set(subscriptionData, { merge: true });

      // Clear cache for this tenant
      this.planCache.delete(tenantId);

      logger.info(`Updated subscription for tenant ${tenantId} to plan ${planCode}`);
      return { ...subscriptionData, plan: planDoc.data() };
    } catch (error: any) {
      logger.error('Failed to update tenant subscription:', error);
      throw error;
    }
  }

  async getUsage(tenantId: string, period: string | null = null) {
    try {
      const currentPeriod = period || new Date().toISOString().slice(0, 7);
      const usageDocId = `${tenantId}_${currentPeriod}`;

      const usageDoc = await db.collection('usage_counters').doc(usageDocId).get();

      if (!usageDoc.exists) {
        return { tenantId, period: currentPeriod, aiRequests: 0, messages: 0, mediaGens: 0 };
      }

      return usageDoc.data();
    } catch (error: any) {
      logger.error('Failed to get usage:', error);
      return { tenantId, period: period || new Date().toISOString().slice(0, 7), aiRequests: 0, messages: 0, mediaGens: 0 };
    }
  }

  async seedDefaultPlans() {
    try {
      const plans = [
        {
          code: 'FREE',
          name: 'Free Plan',
          description: 'Basic features with limited usage',
          price: 0,
          aiRequestsPerMonth: 10,
          messagesPerDay: 100,
          mediaGensPerDay: 0,
          maxBots: 1,
          enableRAG: false,
          enableVideo: false,
          enableAIChat: true,
          enableImageGen: false,
          enableAdvancedTools: false
        },
        {
          code: 'PRO',
          name: 'Pro Plan',
          description: 'Enhanced features for growing businesses',
          price: 2900, // $29.00
          aiRequestsPerMonth: 1000,
          messagesPerDay: 1000,
          mediaGensPerDay: 50,
          maxBots: 5,
          enableRAG: true,
          enableVideo: false,
          enableAIChat: true,
          enableImageGen: true,
          enableAdvancedTools: true
        },
        {
          code: 'BUSINESS',
          name: 'Business Plan',
          description: 'Full features for enterprise use',
          price: 9900, // $99.00
          aiRequestsPerMonth: 10000,
          messagesPerDay: 5000,
          mediaGensPerDay: 500,
          maxBots: 50,
          enableRAG: true,
          enableVideo: true,
          enableAIChat: true,
          enableImageGen: true,
          enableAdvancedTools: true
        }
      ];

      for (const planData of plans) {
        // Upsert logic: Check existence by code then update or add
        const querySnapshot = await db.collection('plans').where('code', '==', planData.code).limit(1).get();

        if (!querySnapshot.empty) {
          const docId = querySnapshot.docs[0].id;
          await db.collection('plans').doc(docId).set(planData, { merge: true });
        } else {
          await db.collection('plans').add(planData);
        }
      }

      logger.info('Default plans seeded successfully');
    } catch (error: any) {
      logger.error('Failed to seed default plans:', error);
      throw error;
    }
  }
}

export default new PlanService();
