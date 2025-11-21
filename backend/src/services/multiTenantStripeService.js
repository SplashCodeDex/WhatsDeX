import Stripe from 'stripe';
import { PrismaClient } from '@prisma/client';
import logger from '../utils/logger.js';
import multiTenantService from './multiTenantService.js';

const prisma = new PrismaClient();

export class MultiTenantStripeService {
  constructor() {
    this.stripe = null;
    this.webhookSecret = null;
    this.isInitialized = false;

    // Subscription plans configuration for multi-tenant SaaS
    this.plans = {
      free: {
        id: 'free',
        name: 'Free',
        price: 0,
        currency: 'usd',
        interval: 'month',
        limits: {
          maxBots: 1,
          maxUsers: 3,
          maxMessages: 100,
          maxApiCalls: 50,
          aiRequests: 10
        },
        features: [
          '1 WhatsApp Bot',
          '3 Team Members',
          '100 Messages/month',
          '10 AI Requests/month',
          'Basic Support'
        ]
      },
      basic: {
        id: 'basic_monthly',
        name: 'Basic',
        price: 2999, // $29.99
        currency: 'usd',
        interval: 'month',
        limits: {
          maxBots: 3,
          maxUsers: 10,
          maxMessages: 5000,
          maxApiCalls: 1000,
          aiRequests: 500
        },
        features: [
          '3 WhatsApp Bots',
          '10 Team Members',
          '5,000 Messages/month',
          '500 AI Requests/month',
          'Priority Support',
          'Analytics Dashboard',
          'Custom Branding'
        ]
      },
      pro: {
        id: 'pro_monthly',
        name: 'Pro',
        price: 9999, // $99.99
        currency: 'usd',
        interval: 'month',
        limits: {
          maxBots: 10,
          maxUsers: 50,
          maxMessages: 50000,
          maxApiCalls: 10000,
          aiRequests: 5000
        },
        features: [
          '10 WhatsApp Bots',
          '50 Team Members',
          '50,000 Messages/month',
          '5,000 AI Requests/month',
          'Advanced Analytics',
          'API Access',
          'Webhook Integration',
          'Custom AI Training',
          'Multi-language Support'
        ]
      },
      enterprise: {
        id: 'enterprise_monthly',
        name: 'Enterprise',
        price: 29999, // $299.99
        currency: 'usd',
        interval: 'month',
        limits: {
          maxBots: -1, // Unlimited
          maxUsers: -1, // Unlimited
          maxMessages: -1, // Unlimited
          maxApiCalls: -1, // Unlimited
          aiRequests: -1 // Unlimited
        },
        features: [
          'Unlimited WhatsApp Bots',
          'Unlimited Team Members',
          'Unlimited Messages',
          'Unlimited AI Requests',
          'Dedicated Support',
          'Custom Integrations',
          'White-label Solution',
          'SLA Guarantee',
          'On-premise Deployment',
          'Advanced Security'
        ]
      }
    };
  }

  async initialize(secretKey, webhookSecret) {
    try {
      if (!secretKey) {
        throw new Error('Stripe secret key is required');
      }

      this.stripe = new Stripe(secretKey, {
        apiVersion: '2023-10-16',
        timeout: 10000,
        maxNetworkRetries: 3,
      });

      this.webhookSecret = webhookSecret;
      this.isInitialized = true;

      logger.info('Multi-tenant Stripe service initialized successfully');
      await this.initializeProducts();
    } catch (error) {
      logger.error('Failed to initialize Stripe service', { error: error.message });
      throw error;
    }
  }

  async initializeProducts() {
    try {
      logger.info('Initializing Stripe products and prices...');

      for (const [planKey, planConfig] of Object.entries(this.plans)) {
        if (planKey === 'free') continue; // Skip free plan

        try {
          // Check if product exists
          let product = await this.findProduct(planConfig.name);
          
          if (!product) {
            product = await this.stripe.products.create({
              id: planConfig.id,
              name: planConfig.name,
              description: `WhatsDeX ${planConfig.name} Plan - ${planConfig.features.join(', ')}`,
              metadata: {
                plan: planKey,
                features: JSON.stringify(planConfig.features),
                limits: JSON.stringify(planConfig.limits)
              }
            });
            logger.info(`Created product: ${planConfig.name}`);
          }

          // Check if price exists
          let price = await this.findPrice(product.id, planConfig.price, planConfig.interval);
          
          if (!price) {
            price = await this.stripe.prices.create({
              product: product.id,
              unit_amount: planConfig.price,
              currency: planConfig.currency,
              recurring: {
                interval: planConfig.interval,
              },
              metadata: {
                plan: planKey
              }
            });
            logger.info(`Created price for ${planConfig.name}: $${planConfig.price / 100}`);
          }

          // Update plan with Stripe IDs
          this.plans[planKey].stripeProductId = product.id;
          this.plans[planKey].stripePriceId = price.id;
        } catch (error) {
          logger.error(`Failed to initialize ${planKey} plan`, { error: error.message });
        }
      }
    } catch (error) {
      logger.error('Failed to initialize products', { error: error.message });
    }
  }

  async findProduct(name) {
    try {
      const products = await this.stripe.products.list({ limit: 100 });
      return products.data.find(p => p.name === name);
    } catch (error) {
      return null;
    }
  }

  async findPrice(productId, amount, interval) {
    try {
      const prices = await this.stripe.prices.list({ 
        product: productId,
        limit: 100 
      });
      return prices.data.find(p => 
        p.unit_amount === amount && 
        p.recurring?.interval === interval
      );
    } catch (error) {
      return null;
    }
  }

  // Customer Management
  async createCustomer(tenantId, customerData) {
    try {
      const tenant = await multiTenantService.getTenant(tenantId);
      if (!tenant) {
        throw new Error('Tenant not found');
      }

      const customer = await this.stripe.customers.create({
        email: customerData.email,
        name: customerData.name || tenant.name,
        phone: customerData.phone,
        metadata: {
          tenant_id: tenantId,
          tenant_subdomain: tenant.subdomain
        }
      });

      // Update tenant with Stripe customer ID
      await multiTenantService.updateTenant(tenantId, {
        stripeCustomerId: customer.id
      });

      logger.info(`Created Stripe customer for tenant: ${tenantId}`, { customerId: customer.id });
      return customer;
    } catch (error) {
      logger.error('Failed to create Stripe customer', { error: error.message });
      throw error;
    }
  }

  // Subscription Management
  async createSubscription(tenantId, plan, paymentMethodId) {
    try {
      const tenant = await multiTenantService.getTenant(tenantId);
      if (!tenant) {
        throw new Error('Tenant not found');
      }

      let customerId = tenant.stripeCustomerId;
      
      // Create customer if doesn't exist
      if (!customerId) {
        const customer = await this.createCustomer(tenantId, {
          email: tenant.email,
          name: tenant.name
        });
        customerId = customer.id;
      }

      // Attach payment method to customer
      await this.stripe.paymentMethods.attach(paymentMethodId, {
        customer: customerId,
      });

      // Update customer's default payment method
      await this.stripe.customers.update(customerId, {
        invoice_settings: {
          default_payment_method: paymentMethodId,
        },
      });

      const planConfig = this.plans[plan];
      if (!planConfig || !planConfig.stripePriceId) {
        throw new Error('Invalid plan or plan not configured');
      }

      // Create subscription
      const subscription = await this.stripe.subscriptions.create({
        customer: customerId,
        items: [{ price: planConfig.stripePriceId }],
        trial_period_days: 14, // 14-day free trial
        metadata: {
          tenant_id: tenantId,
          plan: plan
        }
      });

      // Save subscription to database
      await prisma.tenantSubscription.create({
        data: {
          tenantId,
          stripeSubscriptionId: subscription.id,
          stripePriceId: planConfig.stripePriceId,
          status: subscription.status,
          currentPeriodStart: new Date(subscription.current_period_start * 1000),
          currentPeriodEnd: new Date(subscription.current_period_end * 1000),
          trialStart: subscription.trial_start ? new Date(subscription.trial_start * 1000) : null,
          trialEnd: subscription.trial_end ? new Date(subscription.trial_end * 1000) : null
        }
      });

      // Update tenant plan and limits
      await multiTenantService.updateTenant(tenantId, {
        plan: plan,
        planLimits: JSON.stringify(planConfig.limits)
      });

      logger.info(`Created subscription for tenant: ${tenantId}`, { 
        subscriptionId: subscription.id,
        plan: plan 
      });

      return subscription;
    } catch (error) {
      logger.error('Failed to create subscription', { error: error.message });
      throw error;
    }
  }

  async cancelSubscription(tenantId, immediate = false) {
    try {
      const subscription = await prisma.tenantSubscription.findFirst({
        where: { tenantId, status: 'active' }
      });

      if (!subscription) {
        throw new Error('No active subscription found');
      }

      const canceledSubscription = await this.stripe.subscriptions.update(
        subscription.stripeSubscriptionId,
        {
          cancel_at_period_end: !immediate,
          ...(immediate && { proration_behavior: 'create_prorations' })
        }
      );

      // Update database
      await prisma.tenantSubscription.update({
        where: { id: subscription.id },
        data: {
          status: immediate ? 'canceled' : 'active',
          cancelAtPeriodEnd: !immediate
        }
      });

      if (immediate) {
        // Downgrade to free plan immediately
        await multiTenantService.updateTenant(tenantId, {
          plan: 'free',
          planLimits: JSON.stringify(this.plans.free.limits)
        });
      }

      logger.info(`Canceled subscription for tenant: ${tenantId}`, { immediate });
      return canceledSubscription;
    } catch (error) {
      logger.error('Failed to cancel subscription', { error: error.message });
      throw error;
    }
  }

  // Webhook Handling
  async handleWebhook(body, signature) {
    try {
      if (!this.webhookSecret) {
        throw new Error('Webhook secret not configured');
      }

      const event = this.stripe.webhooks.constructEvent(body, signature, this.webhookSecret);
      
      logger.info(`Processing Stripe webhook: ${event.type}`, { eventId: event.id });

      switch (event.type) {
        case 'customer.subscription.updated':
          await this.handleSubscriptionUpdated(event.data.object);
          break;
        case 'customer.subscription.deleted':
          await this.handleSubscriptionDeleted(event.data.object);
          break;
        case 'invoice.payment_succeeded':
          await this.handlePaymentSucceeded(event.data.object);
          break;
        case 'invoice.payment_failed':
          await this.handlePaymentFailed(event.data.object);
          break;
        default:
          logger.info(`Unhandled webhook event: ${event.type}`);
      }

      return { received: true };
    } catch (error) {
      logger.error('Webhook processing failed', { error: error.message });
      throw error;
    }
  }

  async handleSubscriptionUpdated(subscription) {
    try {
      const tenantId = subscription.metadata.tenant_id;
      
      await prisma.tenantSubscription.updateMany({
        where: { stripeSubscriptionId: subscription.id },
        data: {
          status: subscription.status,
          currentPeriodStart: new Date(subscription.current_period_start * 1000),
          currentPeriodEnd: new Date(subscription.current_period_end * 1000),
          cancelAtPeriodEnd: subscription.cancel_at_period_end
        }
      });

      // If subscription is canceled, downgrade to free
      if (subscription.status === 'canceled') {
        await multiTenantService.updateTenant(tenantId, {
          plan: 'free',
          planLimits: JSON.stringify(this.plans.free.limits)
        });
      }

      logger.info(`Updated subscription: ${subscription.id}`, { tenantId, status: subscription.status });
    } catch (error) {
      logger.error('Failed to handle subscription update', { error: error.message });
    }
  }

  async handleSubscriptionDeleted(subscription) {
    try {
      const tenantId = subscription.metadata.tenant_id;
      
      await prisma.tenantSubscription.updateMany({
        where: { stripeSubscriptionId: subscription.id },
        data: { status: 'canceled' }
      });

      // Downgrade to free plan
      await multiTenantService.updateTenant(tenantId, {
        plan: 'free',
        planLimits: JSON.stringify(this.plans.free.limits)
      });

      logger.info(`Deleted subscription: ${subscription.id}`, { tenantId });
    } catch (error) {
      logger.error('Failed to handle subscription deletion', { error: error.message });
    }
  }

  async handlePaymentSucceeded(invoice) {
    try {
      const tenantId = invoice.subscription_details?.metadata?.tenant_id;
      if (!tenantId) return;

      await prisma.tenantPayment.create({
        data: {
          tenantId,
          stripePaymentId: invoice.payment_intent,
          amount: invoice.amount_paid,
          currency: invoice.currency,
          status: 'succeeded',
          description: invoice.description,
          invoiceUrl: invoice.hosted_invoice_url,
          receiptUrl: invoice.receipt_url
        }
      });

      logger.info(`Payment succeeded for tenant: ${tenantId}`, { 
        amount: invoice.amount_paid,
        invoice: invoice.id 
      });
    } catch (error) {
      logger.error('Failed to handle payment success', { error: error.message });
    }
  }

  async handlePaymentFailed(invoice) {
    try {
      const tenantId = invoice.subscription_details?.metadata?.tenant_id;
      if (!tenantId) return;

      await prisma.tenantPayment.create({
        data: {
          tenantId,
          stripePaymentId: invoice.payment_intent,
          amount: invoice.amount_due,
          currency: invoice.currency,
          status: 'failed',
          description: invoice.description
        }
      });

      // TODO: Send notification to tenant about failed payment
      logger.warn(`Payment failed for tenant: ${tenantId}`, { 
        amount: invoice.amount_due,
        invoice: invoice.id 
      });
    } catch (error) {
      logger.error('Failed to handle payment failure', { error: error.message });
    }
  }

  // Utility Methods
  getPlanLimits(plan) {
    return this.plans[plan]?.limits || this.plans.free.limits;
  }

  getAllPlans() {
    return Object.entries(this.plans).map(([key, plan]) => ({
      id: key,
      ...plan
    }));
  }

  async getCustomerPortalUrl(tenantId, returnUrl) {
    try {
      const tenant = await multiTenantService.getTenant(tenantId);
      if (!tenant?.stripeCustomerId) {
        throw new Error('Customer not found');
      }

      const session = await this.stripe.billingPortal.sessions.create({
        customer: tenant.stripeCustomerId,
        return_url: returnUrl,
      });

      return session.url;
    } catch (error) {
      logger.error('Failed to create customer portal URL', { error: error.message });
      throw error;
    }
  }
}

export default new MultiTenantStripeService();