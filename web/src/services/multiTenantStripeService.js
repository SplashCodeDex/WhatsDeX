// Simplified Stripe service for Next.js
export class MultiTenantStripeService {
  constructor() {
    this.isInitialized = false;
    this.plans = {
      free: { id: 'free', name: 'Free', price: 0 },
      basic: { id: 'basic', name: 'Basic', price: 2999 },
      pro: { id: 'pro', name: 'Pro', price: 9999 },
      enterprise: { id: 'enterprise', name: 'Enterprise', price: 29999 }
    };
  }

  getAllPlans() {
    return Object.entries(this.plans).map(([key, plan]) => ({
      id: key,
      ...plan
    }));
  }

  async initialize() {
    this.isInitialized = true;
    return true;
  }
}

export default new MultiTenantStripeService();