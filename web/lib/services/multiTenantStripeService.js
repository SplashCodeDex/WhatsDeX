// Simplified Stripe service for Next.js
export class MultiTenantStripeService {
  constructor() {
    this.plans = {
      free: {
        id: 'free',
        name: 'Free',
        price: 0,
        features: ['1 Bot', '3 Users', '100 Messages'],
        limits: { maxBots: 1, maxUsers: 3, maxMessages: 100 }
      },
      basic: {
        id: 'basic',
        name: 'Basic',
        price: 2999,
        features: ['3 Bots', '10 Users', '5,000 Messages', 'Analytics'],
        limits: { maxBots: 3, maxUsers: 10, maxMessages: 5000 }
      },
      pro: {
        id: 'pro',
        name: 'Pro',
        price: 9999,
        features: ['10 Bots', '50 Users', '50,000 Messages', 'API Access'],
        limits: { maxBots: 10, maxUsers: 50, maxMessages: 50000 }
      },
      enterprise: {
        id: 'enterprise',
        name: 'Enterprise',
        price: 29999,
        features: ['Unlimited', 'Custom Support', 'On-premise'],
        limits: { maxBots: -1, maxUsers: -1, maxMessages: -1 }
      }
    };
  }

  getAllPlans() {
    return Object.entries(this.plans).map(([key, plan]) => ({
      id: key,
      ...plan
    }));
  }

  async getSubscriptionInfo(tenantId) {
    // Demo subscription data
    return {
      tenant: {
        id: tenantId,
        plan: 'basic',
        status: 'active'
      },
      currentPlan: this.plans.basic,
      usage: {
        bots: 1,
        users: 2,
        messages: 150
      },
      limits: this.plans.basic.limits,
      plans: this.getAllPlans()
    };
  }

  async handleWebhook(body, signature) {
    // Placeholder for Stripe webhook handling
    return { received: true };
  }
}

export default new MultiTenantStripeService();