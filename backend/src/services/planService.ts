import prisma from '../lib/prisma';
import logger from '../utils/logger';

class PlanService {
  constructor() {
    this.planCache = new Map();
  }

  async getTenantPlan(tenantId) {
    try {
      const subscription = await prisma.tenantSubscription.findUnique({
        where: { tenantId },
        include: { plan: true }
      });

      if (!subscription) {
        // Return default FREE plan
        return await this.getDefaultFreePlan();
      }

      // Check if subscription is active
      const now = new Date();
      if (subscription.status !== 'active' || subscription.currentPeriodEnd < now) {
        return await this.getDefaultFreePlan();
      }

      return subscription.plan;
    } catch (error) {
      logger.error('Failed to get tenant plan:', error);
      return await this.getDefaultFreePlan();
    }
  }

  async getDefaultFreePlan() {
    if (this.planCache.has('FREE')) {
      return this.planCache.get('FREE');
    }

    try {
      const plan = await prisma.plan.findUnique({
        where: { code: 'FREE' }
      });

      if (plan) {
        this.planCache.set('FREE', plan);
        return plan;
      }

      // Create default FREE plan if it doesn't exist
      const defaultPlan = await prisma.plan.create({
        data: {
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
        }
      });

      this.planCache.set('FREE', defaultPlan);
      return defaultPlan;
    } catch (error) {
      logger.error('Failed to get default plan:', error);
      throw new Error('Failed to get plan information');
    }
  }

  async checkEntitlement(tenantId, featureKey) {
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
    } catch (error) {
      logger.error('Failed to check entitlement:', error);
      return false;
    }
  }

  async checkUsageLimit(tenantId, limitType) {
    try {
      const plan = await this.getTenantPlan(tenantId);
      const currentPeriod = new Date().toISOString().slice(0, 7); // YYYY-MM

      const usage = await prisma.usageCounter.findUnique({
        where: { tenantId_period: { tenantId, period: currentPeriod } }
      });

      const currentUsage = usage || { aiRequests: 0, messages: 0, mediaGens: 0 };

      switch (limitType) {
        case 'aiRequests':
          return {
            allowed: currentUsage.aiRequests < plan.aiRequestsPerMonth,
            current: currentUsage.aiRequests,
            limit: plan.aiRequestsPerMonth,
            remaining: plan.aiRequestsPerMonth - currentUsage.aiRequests
          };
        case 'messages':
          const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
          // For daily limits, we'd need a more granular counter, for now use monthly
          return {
            allowed: currentUsage.messages < (plan.messagesPerDay * 30),
            current: currentUsage.messages,
            limit: plan.messagesPerDay * 30,
            remaining: (plan.messagesPerDay * 30) - currentUsage.messages
          };
        case 'mediaGens':
          return {
            allowed: currentUsage.mediaGens < plan.mediaGensPerDay,
            current: currentUsage.mediaGens,
            limit: plan.mediaGensPerDay,
            remaining: plan.mediaGensPerDay - currentUsage.mediaGens
          };
        default:
          return { allowed: false, current: 0, limit: 0, remaining: 0 };
      }
    } catch (error) {
      logger.error('Failed to check usage limit:', error);
      return { allowed: false, current: 0, limit: 0, remaining: 0 };
    }
  }

  async incrementUsage(tenantId, counterKey, amount = 1) {
    try {
      const currentPeriod = new Date().toISOString().slice(0, 7); // YYYY-MM

      const updateData = {};
      updateData[counterKey] = { increment: amount };

      await prisma.usageCounter.upsert({
        where: { tenantId_period: { tenantId, period: currentPeriod } },
        create: {
          tenantId,
          period: currentPeriod,
          [counterKey]: amount
        },
        update: updateData
      });

      logger.debug(`Incremented ${counterKey} by ${amount} for tenant ${tenantId}`);
    } catch (error) {
      logger.error('Failed to increment usage:', error);
      throw new Error('Failed to update usage counter');
    }
  }

  async updateTenantSubscription(tenantId, planCode, stripeSubscriptionId, status, currentPeriodStart, currentPeriodEnd) {
    try {
      const plan = await prisma.plan.findUnique({
        where: { code: planCode }
      });

      if (!plan) {
        throw new Error(`Plan not found: ${planCode}`);
      }

      const subscription = await prisma.tenantSubscription.upsert({
        where: { tenantId },
        create: {
          tenantId,
          planId: plan.id,
          status,
          stripeSubscriptionId,
          currentPeriodStart,
          currentPeriodEnd
        },
        update: {
          planId: plan.id,
          status,
          stripeSubscriptionId,
          currentPeriodStart,
          currentPeriodEnd
        },
        include: { plan: true }
      });

      // Clear cache for this tenant
      this.planCache.delete(tenantId);

      logger.info(`Updated subscription for tenant ${tenantId} to plan ${planCode}`);
      return subscription;
    } catch (error) {
      logger.error('Failed to update tenant subscription:', error);
      throw error;
    }
  }

  async getUsage(tenantId, period = null) {
    try {
      const currentPeriod = period || new Date().toISOString().slice(0, 7);
      
      const usage = await prisma.usageCounter.findUnique({
        where: { tenantId_period: { tenantId, period: currentPeriod } }
      });

      return usage || { tenantId, period: currentPeriod, aiRequests: 0, messages: 0, mediaGens: 0 };
    } catch (error) {
      logger.error('Failed to get usage:', error);
      return { tenantId, period: currentPeriod, aiRequests: 0, messages: 0, mediaGens: 0 };
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
        await prisma.plan.upsert({
          where: { code: planData.code },
          create: planData,
          update: planData
        });
      }

      logger.info('Default plans seeded successfully');
    } catch (error) {
      logger.error('Failed to seed default plans:', error);
      throw error;
    }
  }
}

export default new PlanService();
