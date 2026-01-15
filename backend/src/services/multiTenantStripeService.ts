import Stripe from 'stripe';
import logger from '../utils/logger.js';
import { ConfigService } from './ConfigService.js';

interface Plan {
  id: string;
  name: string;
  price: number;
  currency: string;
  interval: 'month' | 'year';
  features: string[];
  priceId?: string;
}

export class MultiTenantStripeService {
  private static instance: MultiTenantStripeService;
  private stripe: Stripe | null;
  private webhookSecret: string | null;
  private isInitialized: boolean;
  public plans: Record<string, Plan>;

  private constructor() {
    this.stripe = null;
    this.webhookSecret = null;
    this.isInitialized = false;

    this.plans = {
      basic: {
        id: 'basic',
        name: 'Basic',
        price: 999,
        currency: 'usd',
        interval: 'month',
        features: ['ai_requests:100', 'image_generation:25', 'commands:5000'],
      },
      pro: {
        id: 'pro',
        name: 'Pro',
        price: 2499,
        currency: 'usd',
        interval: 'month',
        features: ['ai_requests:unlimited', 'image_generation:100', 'commands:unlimited', 'premium_commands', 'analytics', 'api_access'],
      },
      enterprise: {
        id: 'enterprise',
        name: 'Enterprise',
        price: 9999,
        currency: 'usd',
        interval: 'month',
        features: ['ai_requests:unlimited', 'image_generation:unlimited', 'commands:unlimited', 'premium_commands', 'analytics', 'api_access', 'white_label', 'custom_integrations', 'dedicated_support'],
      },
    };
  }

  public static getInstance(): MultiTenantStripeService {
    if (!MultiTenantStripeService.instance) {
      MultiTenantStripeService.instance = new MultiTenantStripeService();
    }
    return MultiTenantStripeService.instance;
  }

  async initialize(secretKey: string, webhookSecret: string) {
    try {
      this.stripe = new Stripe(secretKey, {
        apiVersion: '2025-12-15.clover', // Update to match StripeService
      });
      this.webhookSecret = webhookSecret;
      this.isInitialized = true;
      logger.info('MultiTenant Stripe service initialized successfully');
    } catch (error: any) {
      logger.error('Failed to initialize MultiTenant Stripe service', { error: error.message });
      throw error;
    }
  }

  async createCustomer(tenantId: string, customerData: any) {
    if (!this.stripe) throw new Error('Stripe not initialized');
    try {
      const customer = await this.stripe.customers.create({
        email: customerData.email,
        name: customerData.name,
        metadata: {
          tenantId,
          ...customerData.metadata
        },
      });
      return customer;
    } catch (error: any) {
      logger.error(`Stripe createCustomer error for tenant ${tenantId}:`, error);
      throw error;
    }
  }

  async createSubscription(tenantId: string, planKey: string, paymentMethodId?: string) {
    if (!this.stripe) throw new Error('Stripe not initialized');
    try {
      const plan = this.plans[planKey];
      if (!plan) throw new Error(`Plan ${planKey} not found`);

      // Ideally look up customer by tenantId first, here assuming passed or handled elsewhere
      // This is a simplified implementation matching previous logic structure
      
      // Placeholder return
      return { id: 'sub_mock', status: 'active' }; 
    } catch (error: any) {
      logger.error(`Stripe createSubscription error for tenant ${tenantId}:`, error);
      throw error;
    }
  }

  async cancelSubscription(tenantId: string, immediate = false) {
    if (!this.stripe) throw new Error('Stripe not initialized');
    // Implementation placeholder
    return { status: 'canceled' };
  }

  async handleWebhook(body: any, signature: string) {
    if (!this.stripe || !this.webhookSecret) throw new Error('Stripe not initialized');
    try {
      const event = this.stripe.webhooks.constructEvent(body, signature, this.webhookSecret);
      return event;
    } catch (error: any) {
      logger.error('Stripe webhook error:', error);
      throw error;
    }
  }
}

export const multiTenantStripeService = MultiTenantStripeService.getInstance();
export default multiTenantStripeService;
