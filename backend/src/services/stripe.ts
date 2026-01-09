import Stripe from 'stripe';
import logger from '../utils/logger.js';

export class StripeService {
  private static instance: StripeService;
  private stripe: Stripe | null;
  private webhookSecret: string | null;
  private isInitialized: boolean;
  public plans: any;

  constructor() {
    this.stripe = null;
    this.webhookSecret = null;
    this.isInitialized = false;

    this.plans = {
      basic: {
        id: 'basic',
        name: 'Basic',
        price: 999, // $9.99
        currency: 'usd',
        interval: 'month',
        features: ['ai_requests:100', 'image_generation:25', 'commands:5000'],
      },
      pro: {
        id: 'pro',
        name: 'Pro',
        price: 2499, // $24.99
        currency: 'usd',
        interval: 'month',
        features: ['ai_requests:unlimited', 'image_generation:100', 'commands:unlimited', 'premium_commands', 'analytics', 'api_access'],
      },
      enterprise: {
        id: 'enterprise',
        name: 'Enterprise',
        price: 9999, // $99.99
        currency: 'usd',
        interval: 'month',
        features: ['ai_requests:unlimited', 'image_generation:unlimited', 'commands:unlimited', 'premium_commands', 'analytics', 'api_access', 'white_label', 'custom_integrations', 'dedicated_support'],
      },
    };
  }

  public static getInstance(): StripeService {
    if (!StripeService.instance) {
      StripeService.instance = new StripeService();
    }
    return StripeService.instance;
  }

  async initialize(secretKey: string, webhookSecret: string) {
    try {
      this.stripe = new Stripe(secretKey, {
        apiVersion: '2025-12-15.clover',
      });
      this.webhookSecret = webhookSecret;
      this.isInitialized = true;
      logger.info('Stripe service initialized successfully');
    } catch (error: any) {
      logger.error('Failed to initialize Stripe service', { error: error.message });
      throw error;
    }
  }

  async createCustomer(customerData: any) {
    if (!this.stripe) throw new Error('Stripe not initialized');
    try {
      const customer = await this.stripe.customers.create({
        email: customerData.email,
        name: customerData.name,
        phone: customerData.phone,
        metadata: {
          userId: customerData.userId,
        },
      });
      return customer;
    } catch (error: any) {
      logger.error('Stripe createCustomer error:', error);
      throw error;
    }
  }

  async createSubscription(customerId: string, planKey: string, options: any = {}) {
    if (!this.stripe) throw new Error('Stripe not initialized');
    try {
      const plan = this.plans[planKey];
      if (!plan) throw new Error(`Plan ${planKey} not found`);

      const subscription = await this.stripe.subscriptions.create({
        customer: customerId,
        items: [{ price: plan.priceId || plan.id }], // Should use priceId from init
        metadata: {
          planKey,
          userId: options.userId,
        },
        payment_behavior: 'default_incomplete',
        expand: ['latest_invoice.payment_intent'],
      });
      return subscription;
    } catch (error: any) {
      logger.error('Stripe createSubscription error:', error);
      throw error;
    }
  }

  async cancelSubscription(subscriptionId: string, cancelAtPeriodEnd = true) {
    if (!this.stripe) throw new Error('Stripe not initialized');
    try {
      const subscription = await this.stripe.subscriptions.update(subscriptionId, {
        cancel_at_period_end: cancelAtPeriodEnd,
      });
      return subscription;
    } catch (error: any) {
      logger.error('Stripe cancelSubscription error:', error);
      throw error;
    }
  }

  async updateSubscriptionPlan(subscriptionId: string, newPlanKey: string) {
    if (!this.stripe) throw new Error('Stripe not initialized');
    try {
      const newPlan = this.plans[newPlanKey];
      if (!newPlan) throw new Error(`Plan ${newPlanKey} not found`);

      const subscription = await this.stripe.subscriptions.retrieve(subscriptionId);
      const updatedSubscription = await this.stripe.subscriptions.update(subscriptionId, {
        items: [
          {
            id: subscription.items.data[0].id,
            price: newPlan.priceId || newPlan.id,
          },
        ],
      });
      return updatedSubscription;
    } catch (error: any) {
      logger.error('Stripe updateSubscriptionPlan error:', error);
      throw error;
    }
  }

  async handleWebhook(payload: any, signature: string) {
    if (!this.stripe || !this.webhookSecret) throw new Error('Stripe not initialized');
    try {
      const event = this.stripe.webhooks.constructEvent(payload, signature, this.webhookSecret);
      return event;
    } catch (error: any) {
      logger.error('Stripe webhook error:', error);
      throw error;
    }
  }

  async getCustomer(customerId: string) {
    if (!this.stripe) throw new Error('Stripe not initialized');
    try {
      return await this.stripe.customers.retrieve(customerId);
    } catch (error: any) {
      logger.error('Stripe getCustomer error:', error);
      throw error;
    }
  }

  async healthCheck() {
    if (!this.stripe) return { status: 'unhealthy', error: 'Stripe not initialized' };
    try {
      await this.stripe.balance.retrieve();
      return { status: 'healthy' };
    } catch (error: any) {
      return { status: 'unhealthy', error: error.message };
    }
  }
}

export const stripeService = StripeService.getInstance();
export default stripeService;