import Stripe from 'stripe';
import { StripeService, stripeService } from './stripeService.js';
import logger from '../utils/logger.js';
import { db } from '../lib/firebase.js';
import { Timestamp, FieldValue } from 'firebase-admin/firestore';
import UserService from './userService.js';

interface UsageLimits {
  aiRequests: number;
  imageGenerations: number;
  commands: number;
  storage: number;
  premiumCommands: boolean;
  analytics: boolean;
  apiAccess: boolean;
  whiteLabel?: boolean;
  customIntegrations?: boolean;
  dedicatedSupport?: boolean;
}

interface SubscriptionDocument {
  id: string;
  stripeSubscriptionId: string;
  userId: string;
  planKey: string;
  status: string;
  currentPeriodStart: Timestamp | Date;
  currentPeriodEnd: Timestamp | Date;
  cancelAtPeriodEnd: boolean;
  createdAt: Timestamp;
  cancelledAt?: Timestamp | null;
}

class SubscriptionService {
  private stripe: StripeService;
  private isInitialized: boolean;
  public usageLimits: Record<string, UsageLimits>;

  constructor() {
    // databaseService ignored as we use Firestore directly now
    this.stripe = stripeService;
    this.isInitialized = false;

    // Usage limits for different plans
    this.usageLimits = {
      free: {
        aiRequests: 50,
        imageGenerations: 10,
        commands: 1000,
        storage: 100 * 1024 * 1024, // 100MB
        premiumCommands: false,
        analytics: false,
        apiAccess: false,
      },
      basic: {
        aiRequests: 100,
        imageGenerations: 25,
        commands: 5000,
        storage: 500 * 1024 * 1024, // 500MB
        premiumCommands: false,
        analytics: false,
        apiAccess: false,
      },
      pro: {
        aiRequests: -1, // Unlimited
        imageGenerations: 100,
        commands: -1, // Unlimited
        storage: 2 * 1024 * 1024 * 1024, // 2GB
        premiumCommands: true,
        analytics: true,
        apiAccess: true,
      },
      enterprise: {
        aiRequests: -1, // Unlimited
        imageGenerations: -1, // Unlimited
        commands: -1, // Unlimited
        storage: 10 * 1024 * 1024 * 1024, // 10GB
        premiumCommands: true,
        analytics: true,
        apiAccess: true,
        whiteLabel: true,
        customIntegrations: true,
        dedicatedSupport: true,
      },
    };

    logger.info('Subscription service initialized');
  }

  /**
   * Initialize subscription service
   * @param {Object} config - Configuration object
   */
  async initialize(config: { stripeSecretKey: string; stripeWebhookSecret: string }) {
    try {
      await this.stripe.initialize(config.stripeSecretKey, config.stripeWebhookSecret);

      this.isInitialized = true;
      logger.info('Subscription service initialized successfully');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      logger.error('Failed to initialize subscription service', { error: message });
      throw error;
    }
  }

  /**
   * Create a new subscription for a user
   * @param {string} userId - User ID
   * @param {string} planKey - Plan key (basic, pro, enterprise)
   * @param {string} _paymentMethod - Payment method details (unused)
   * @returns {Promise<Object>} Subscription result
   */
  async createSubscription(userId: string, planKey: string, _paymentMethod: unknown) {
    try {
      // Validate plan
      if (!this.usageLimits[planKey]) {
        throw new Error(`Invalid plan key: ${planKey}`);
      }

      // Get or create Stripe customer
      let customer = await this.getStripeCustomer(userId);
      if (!customer) {
        // Fix: Use a placeholder or proper tenantId if available
        // In the new architecture, everything is tenant-scoped.
        // For legacy compatibility, we'll use a 'default' tenant or skip if not found.
        const user = await UserService.getUserById('default', userId);
        if (!user) {
          throw new Error(`User not found: ${userId}`);
        }

        const userData = user as { email?: string; name?: string; phone?: string }; // Temporary cast until strict User type import

        customer = await this.stripe.createCustomer({
          userId,
          email: userData.email || '',
          name: userData.name,
          phone: userData.phone,
        });

        if (customer.deleted) {
          throw new Error('Stripe customer is deleted');
        }

        // Save customer ID to database
        await db.collection('users').doc(userId).update({
          stripeCustomerId: customer.id,
        });
      }

      // Create subscription
      const subscription = await this.stripe.createSubscription(customer.id, planKey, { userId });

      const sub = subscription as Stripe.Subscription;

      // Save subscription to database
      const subscriptionData = {
        userId,
        stripeSubscriptionId: sub.id,
        planKey,
        status: sub.status,
        currentPeriodStart: Timestamp.fromDate(new Date((sub as unknown as { current_period_start: number }).current_period_start * 1000)),
        currentPeriodEnd: Timestamp.fromDate(new Date((sub as unknown as { current_period_end: number }).current_period_end * 1000)),
        cancelAtPeriodEnd: sub.cancel_at_period_end,
        createdAt: Timestamp.now(),
      };

      await db.collection('subscriptions').add(subscriptionData);

      // Reset usage counters for new subscription
      await this.resetUsageCounters(userId);

      logger.info('Subscription created successfully', {
        userId,
        planKey,
        subscriptionId: sub.id,
      });

      const latestInvoice = sub.latest_invoice as unknown as { payment_intent?: string | { client_secret?: string } };
      const paymentIntent = latestInvoice?.payment_intent;
      const clientSecret = typeof paymentIntent === 'object' ? paymentIntent.client_secret : undefined;

      return {
        subscription: sub,
        clientSecret,
      };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      logger.error('Failed to create subscription', {
        userId,
        planKey,
        error: message,
      });
      throw error;
    }
  }

  /**
   * Cancel user subscription
   * @param {string} userId - User ID
   * @param {boolean} cancelAtPeriodEnd - Cancel at period end or immediately
   * @returns {Promise<Object>} Cancellation result
   */
  async cancelSubscription(userId: string, cancelAtPeriodEnd = true) {
    try {
      const snapshot = await db.collection('subscriptions')
        .where('userId', '==', userId)
        .where('status', 'in', ['active', 'trialing'])
        .limit(1)
        .get();

      if (snapshot.empty) {
        throw new Error('No active subscription found');
      }

      const doc = snapshot.docs[0];
      const subscription = { id: doc.id, ...doc.data() } as SubscriptionDocument;

      const stripeSubscription = await this.stripe.cancelSubscription(
        subscription.stripeSubscriptionId,
        cancelAtPeriodEnd
      );

      // Update database
      await db.collection('subscriptions').doc(subscription.id).update({
        status: stripeSubscription.status,
        cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end,
        cancelledAt: cancelAtPeriodEnd ? null : Timestamp.now(),
      });

      logger.info('Subscription cancelled', {
        userId,
        subscriptionId: subscription.stripeSubscriptionId,
        cancelAtPeriodEnd,
      });

      return stripeSubscription;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      logger.error('Failed to cancel subscription', {
        userId,
        error: message,
      });
      throw error;
    }
  }

  /**
   * Update user subscription plan
   * @param {string} userId - User ID
   * @param {string} newPlanKey - New plan key
   * @returns {Promise<Object>} Update result
   */
  async updateSubscriptionPlan(userId: string, newPlanKey: string) {
    try {
      if (!this.usageLimits[newPlanKey]) {
        throw new Error(`Invalid plan key: ${newPlanKey}`);
      }

      const snapshot = await db.collection('subscriptions')
        .where('userId', '==', userId)
        .where('status', 'in', ['active', 'trialing'])
        .limit(1)
        .get();

      if (snapshot.empty) {
        throw new Error('No active subscription found');
      }

      const doc = snapshot.docs[0];
      const subscription = { id: doc.id, ...doc.data() } as SubscriptionDocument;

      const stripeSubscription = await this.stripe.updateSubscriptionPlan(
        subscription.stripeSubscriptionId,
        newPlanKey
      );

      // Update database
      const sub = stripeSubscription;
      const timestampStart = (sub as unknown as { current_period_start: number }).current_period_start;
      const timestampEnd = (sub as unknown as { current_period_end: number }).current_period_end;

      await db.collection('subscriptions').doc(subscription.id).update({
        planKey: newPlanKey,
        status: sub.status,
        currentPeriodStart: Timestamp.fromDate(new Date(timestampStart * 1000)),
        currentPeriodEnd: Timestamp.fromDate(new Date(timestampEnd * 1000)),
      });

      logger.info('Subscription plan updated', {
        userId,
        oldPlan: subscription.planKey,
        newPlan: newPlanKey,
      });

      return stripeSubscription;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      logger.error('Failed to update subscription plan', {
        userId,
        newPlanKey,
        error: message,
      });
      throw error;
    }
  }

  /**
   * Check if user has access to a feature
   * @param {string} userId - User ID
   * @param {string} feature - Feature name
   * @returns {Promise<boolean>} Access status
   */
  async checkFeatureAccess(userId: string, feature: string) {
    try {
      const planKey = await this.getUserPlan(userId);
      const limits = this.usageLimits[planKey];

      if (!limits) {
        return false;
      }

      // Check specific feature access
      switch (feature) {
        case 'ai_requests':
          return limits.aiRequests === -1 || limits.aiRequests > 0;
        case 'image_generation':
          return limits.imageGenerations === -1 || limits.imageGenerations > 0;
        case 'premium_commands':
          return limits.premiumCommands;
        case 'analytics':
          return limits.analytics;
        case 'api_access':
          return limits.apiAccess;
        case 'white_label':
          return limits.whiteLabel;
        case 'custom_integrations':
          return limits.customIntegrations;
        case 'dedicated_support':
          return limits.dedicatedSupport;
        default:
          return false;
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      logger.error('Failed to check feature access', {
        userId,
        feature,
        error: message,
      });
      return false;
    }
  }

  /**
   * Track usage for a user
   * @param {string} userId - User ID
   * @param {string} feature - Feature name
   * @param {number} amount - Usage amount
   * @returns {Promise<Object>} Usage tracking result
   */
  async trackUsage(userId: string, feature: string, amount = 1) {
    try {
      const planKey = await this.getUserPlan(userId);
      const limits = this.usageLimits[planKey];

      if (!limits) {
        throw new Error('Invalid plan configuration');
      }

      // Get current usage
      const currentUsage = await this.getCurrentUsage(userId, feature);

      // Check limits
      const limit = this.getFeatureLimit(planKey, feature);
      if (limit !== -1 && currentUsage + amount > limit) {
        throw new Error(`Usage limit exceeded for ${feature}`);
      }

      // Update usage in database
      const usageKey = `${feature}_used`;
      await db.collection('users').doc(userId).update({
        [usageKey]: FieldValue.increment(amount)
      });

      const newUsage = currentUsage + amount; // This is approx for return value

      // Log usage
      await db.collection('analytics').add({
        metric: `usage_${feature}`,
        value: amount,
        category: 'usage',
        metadata: JSON.stringify({ userId, planKey }),
        recordedAt: Timestamp.now(),
      });

      logger.debug('Usage tracked', {
        userId,
        feature,
        amount,
        newTotal: newUsage,
        limit,
      });

      return {
        used: newUsage,
        limit,
        remaining: limit === -1 ? -1 : limit - newUsage,
      };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      logger.error('Failed to track usage', {
        userId,
        feature,
        amount,
        error: message,
      });
      throw error;
    }
  }

  /**
   * Get current usage for a user and feature
   * @param {string} userId - User ID
   * @param {string} feature - Feature name
   * @returns {Promise<number>} Current usage
   */
  async getCurrentUsage(userId: string, feature: string) {
    try {
      const usageKey = `${feature}_used`;
      const doc = await db.collection('users').doc(userId).get();

      if (!doc.exists) return 0;
      return doc.data()?.[usageKey] || 0;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      logger.error('Failed to get current usage', {
        userId,
        feature,
        error: message,
      });
      return 0;
    }
  }

  /**
   * Get feature limit for a plan
   * @param {string} planKey - Plan key
   * @param {string} feature - Feature name
   * @returns {number} Feature limit
   */
  getFeatureLimit(planKey: string, feature: string) {
    const limits = this.usageLimits[planKey];
    if (!limits) return 0;

    switch (feature) {
      case 'ai_requests':
        return limits.aiRequests;
      case 'image_generation':
        return limits.imageGenerations;
      case 'commands':
        return limits.commands;
      case 'storage':
        return limits.storage;
      default:
        return 0;
    }
  }

  /**
   * Get user's current plan
   * @param {string} userId - User ID
   * @returns {Promise<string>} Plan key
   */
  async getUserPlan(userId: string) {
    try {
      const snapshot = await db.collection('subscriptions')
        .where('userId', '==', userId)
        .where('status', 'in', ['active', 'trialing'])
        .orderBy('createdAt', 'desc')
        .limit(1)
        .get();

      if (snapshot.empty) return 'free';
      return snapshot.docs[0].data().planKey || 'free';
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      logger.error('Failed to get user plan', {
        userId,
        error: message,
      });
      return 'free';
    }
  }

  /**
   * Get user's subscription details
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Subscription details
   */
  async getUserSubscription(userId: string) {
    try {
      const snapshot = await db.collection('subscriptions')
        .where('userId', '==', userId)
        .where('status', 'in', ['active', 'trialing'])
        .orderBy('createdAt', 'desc')
        .limit(1)
        .get();

      if (snapshot.empty) {
        return {
          plan: 'free',
          status: 'none',
          limits: this.usageLimits.free,
        };
      }

      const sub = snapshot.docs[0].data();

      return {
        id: snapshot.docs[0].id,
        plan: sub.planKey,
        status: sub.status,
        currentPeriodStart: sub.currentPeriodStart instanceof Timestamp ? sub.currentPeriodStart.toDate() : sub.currentPeriodStart,
        currentPeriodEnd: sub.currentPeriodEnd instanceof Timestamp ? sub.currentPeriodEnd.toDate() : sub.currentPeriodEnd,
        cancelAtPeriodEnd: sub.cancelAtPeriodEnd,
        limits: this.usageLimits[sub.planKey] || this.usageLimits.free,
      };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      logger.error('Failed to get user subscription', {
        userId,
        error: message,
      });
      return {
        plan: 'free',
        status: 'error',
        limits: this.usageLimits.free,
      };
    }
  }

  /**
   * Reset usage counters (called monthly or on subscription change)
   * @param {string} userId - User ID
   * @returns {Promise<void>}
   */
  async resetUsageCounters(userId: string) {
    try {
      await db.collection('users').doc(userId).update({
        ai_requests_used: 0,
        image_generations_used: 0,
        commands_used: 0,
        storage_used: 0,
      });

      logger.info('Usage counters reset', { userId });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      logger.error('Failed to reset usage counters', {
        userId,
        error: message,
      });
      throw error;
    }
  }

  /**
   * Get Stripe customer for user
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Stripe customer
   */
  async getStripeCustomer(userId: string) {
    try {
      const doc = await db.collection('users').doc(userId).get();
      const user = doc.data();

      if (!user?.stripeCustomerId) {
        return null;
      }

      return await this.stripe.getCustomer(user.stripeCustomerId);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      logger.error('Failed to get Stripe customer', {
        userId,
        error: message,
      });
      return null;
    }
  }

  getPlans() {
    return this.usageLimits;
  }

  /**
   * Handle Stripe webhook events
   * @param {Object} event - Stripe webhook event
   * @returns {Promise<void>}
   */
  async handleWebhook(event: Stripe.Event) {
    try {
      switch (event.type) {
        case 'customer.subscription.created':
        case 'customer.subscription.updated':
          await this.handleSubscriptionUpdate(event.data.object);
          break;

        case 'customer.subscription.deleted':
          await this.handleSubscriptionCancellation(event.data.object);
          break;

        case 'invoice.payment_succeeded':
          await this.handlePaymentSuccess(event.data.object);
          break;

        case 'invoice.payment_failed':
          await this.handlePaymentFailure(event.data.object);
          break;

        default:
          logger.debug('Unhandled webhook event', { type: event.type });
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      logger.error('Failed to handle webhook', {
        eventType: event.type,
        error: message,
      });
      throw error;
    }
  }

  /**
   * Handle subscription updates from webhooks
   * @param {Object} subscription - Stripe subscription object
   */
  async handleSubscriptionUpdate(subscription: Stripe.Subscription) {
    try {
      const snapshot = await db.collection('subscriptions')
        .where('stripeSubscriptionId', '==', subscription.id)
        .limit(1)
        .get();

      if (!snapshot.empty) {
        const docId = snapshot.docs[0].id;
        const localSub = snapshot.docs[0].data();

        const sub = subscription as unknown as { current_period_start: number; current_period_end: number };

        await db.collection('subscriptions').doc(docId).update({
          status: subscription.status,
          currentPeriodStart: Timestamp.fromDate(new Date(sub.current_period_start * 1000)),
          currentPeriodEnd: Timestamp.fromDate(new Date(sub.current_period_end * 1000)),
          cancelAtPeriodEnd: subscription.cancel_at_period_end,
        });

        // Reset usage counters on renewal
        if (subscription.status === 'active') {
          await this.resetUsageCounters(localSub.userId);
        }

        logger.info('Subscription updated from webhook', {
          subscriptionId: subscription.id,
          status: subscription.status,
        });
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      logger.error('Failed to handle subscription update', {
        subscriptionId: subscription.id,
        error: message,
      });
    }
  }

  /**
   * Handle subscription cancellations from webhooks
   * @param {Object} subscription - Stripe subscription object
   */
  async handleSubscriptionCancellation(subscription: Stripe.Subscription) {
    try {
      const snapshot = await db.collection('subscriptions')
        .where('stripeSubscriptionId', '==', subscription.id)
        .get();

      const batch = db.batch();
      snapshot.docs.forEach(doc => {
        batch.update(doc.ref, {
          status: 'canceled',
          cancelledAt: Timestamp.now()
        });
      });
      await batch.commit();

      logger.info('Subscription cancelled from webhook', {
        subscriptionId: subscription.id,
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      logger.error('Failed to handle subscription cancellation', {
        subscriptionId: subscription.id,
        error: message,
      });
    }
  }

  /**
   * Handle successful payments from webhooks
   * @param {Object} invoice - Stripe invoice object
   */
  async handlePaymentSuccess(invoice: Stripe.Invoice) {
    try {
      // Record payment in database
      const customerMetadata = (invoice.metadata) as Record<string, string> | undefined; // Stripe metadata is Record<string, string>
      const userId = customerMetadata?.userId;

      await db.collection('payments').add({
        userId,
        amount: invoice.amount_due,
        currency: invoice.currency,
        status: 'completed',
        paymentMethod: 'stripe',
        transactionId: invoice.id,
        description: `Subscription payment - ${(invoice as unknown as { subscription: string }).subscription}`,
        createdAt: Timestamp.now(),
      });

      logger.info('Payment recorded', {
        invoiceId: invoice.id,
        amount: invoice.amount_due,
        customerId: invoice.customer,
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      logger.error('Failed to handle payment success', {
        invoiceId: invoice.id,
        error: message,
      });
    }
  }

  /**
   * Handle failed payments from webhooks
   * @param {Object} invoice - Stripe invoice object
   */
  async handlePaymentFailure(invoice: Stripe.Invoice) {
    try {
      // Record failed payment
      const customerMetadata = (invoice.metadata) as Record<string, string> | undefined;

      await db.collection('payments').add({
        userId: customerMetadata?.userId,
        amount: invoice.amount_due,
        currency: invoice.currency,
        status: 'failed',
        paymentMethod: 'stripe',
        transactionId: invoice.id,
        description: `Failed payment - ${(invoice as unknown as { subscription: string }).subscription}`,
        createdAt: Timestamp.now(),
      });

      logger.warn('Payment failed', {
        invoiceId: invoice.id,
        customerId: invoice.customer,
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      logger.error('Failed to handle payment failure', {
        invoiceId: invoice.id,
        error: message,
      });
    }
  }

  isReady() {
    return this.isInitialized;
  }

  async healthCheck() {
    try {
      const stripeHealth = await this.stripe.healthCheck();

      return {
        status: 'healthy',
        service: 'subscription',
        initialized: this.isInitialized,
        stripe: stripeHealth,
        plansCount: Object.keys(this.usageLimits).length,
        timestamp: new Date().toISOString(),
      };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      logger.error('Subscription health check failed', { error: message });
      return {
        status: 'unhealthy',
        service: 'subscription',
        error: message,
        timestamp: new Date().toISOString(),
      };
    }
  }
}

export default SubscriptionService;
