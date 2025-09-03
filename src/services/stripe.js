const Stripe = require('stripe');
const logger = require('../utils/logger');

class StripeService {
  constructor() {
    this.stripe = null;
    this.webhookSecret = null;
    this.isInitialized = false;

    // Subscription plans configuration
    this.plans = {
      basic: {
        id: 'basic_monthly',
        name: 'Basic',
        price: 499, // $4.99
        currency: 'usd',
        interval: 'month',
        features: [
          '100 AI requests per month',
          'Basic image generation',
          'Standard support',
          'Community access'
        ]
      },
      pro: {
        id: 'pro_monthly',
        name: 'Pro',
        price: 999, // $9.99
        currency: 'usd',
        interval: 'month',
        features: [
          'Unlimited AI requests',
          'Advanced image generation',
          'Priority support',
          'Custom commands',
          'Analytics dashboard',
          'API access'
        ]
      },
      enterprise: {
        id: 'enterprise_monthly',
        name: 'Enterprise',
        price: 2999, // $29.99
        currency: 'usd',
        interval: 'month',
        features: [
          'Everything in Pro',
          'White-label solution',
          'Dedicated support',
          'Custom integrations',
          'Advanced analytics',
          'SLA guarantee',
          'Custom training'
        ]
      }
    };

    logger.info('Stripe service initialized');
  }

  /**
   * Initialize Stripe service
   * @param {string} secretKey - Stripe secret key
   * @param {string} webhookSecret - Stripe webhook secret
   */
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

      logger.info('Stripe service initialized successfully');

      // Create or verify subscription products
      await this.initializeProducts();

    } catch (error) {
      logger.error('Failed to initialize Stripe service', { error: error.message });
      throw error;
    }
  }

  /**
   * Initialize Stripe products and prices
   */
  async initializeProducts() {
    try {
      logger.info('Initializing Stripe products and prices...');

      for (const [planKey, planConfig] of Object.entries(this.plans)) {
        // Check if product exists
        let product;
        const products = await this.stripe.products.list({ limit: 100 });

        product = products.data.find(p => p.metadata.plan_key === planKey);

        if (!product) {
          // Create product
          product = await this.stripe.products.create({
            name: planConfig.name,
            description: `${planConfig.name} subscription plan`,
            metadata: {
              plan_key: planKey,
              features: JSON.stringify(planConfig.features)
            }
          });
          logger.info(`Created Stripe product: ${product.name}`);
        }

        // Check if price exists
        const prices = await this.stripe.prices.list({
          product: product.id,
          active: true
        });

        let price = prices.data.find(p =>
          p.unit_amount === planConfig.price &&
          p.currency === planConfig.currency &&
          p.recurring?.interval === planConfig.interval
        );

        if (!price) {
          // Create price
          price = await this.stripe.prices.create({
            product: product.id,
            unit_amount: planConfig.price,
            currency: planConfig.currency,
            recurring: {
              interval: planConfig.interval,
              interval_count: 1
            },
            metadata: {
              plan_key: planKey
            }
          });
          logger.info(`Created Stripe price: ${price.id} for ${planConfig.name}`);
        }

        // Update plan with Stripe IDs
        this.plans[planKey].productId = product.id;
        this.plans[planKey].priceId = price.id;
      }

      logger.info('Stripe products and prices initialized successfully');

    } catch (error) {
      logger.error('Failed to initialize Stripe products', { error: error.message });
      throw error;
    }
  }

  /**
   * Create a customer
   * @param {Object} customerData - Customer data
   * @returns {Promise<Object>} Stripe customer object
   */
  async createCustomer(customerData) {
    try {
      const customer = await this.stripe.customers.create({
        email: customerData.email,
        name: customerData.name,
        phone: customerData.phone,
        metadata: {
          userId: customerData.userId,
          source: 'whatsdex'
        }
      });

      logger.info('Stripe customer created', {
        customerId: customer.id,
        userId: customerData.userId
      });

      return customer;
    } catch (error) {
      logger.error('Failed to create Stripe customer', {
        userId: customerData.userId,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Create a subscription
   * @param {string} customerId - Stripe customer ID
   * @param {string} planKey - Plan key (basic, pro, enterprise)
   * @param {Object} options - Additional options
   * @returns {Promise<Object>} Subscription object
   */
  async createSubscription(customerId, planKey, options = {}) {
    try {
      const plan = this.plans[planKey];
      if (!plan) {
        throw new Error(`Invalid plan key: ${planKey}`);
      }

      const subscriptionData = {
        customer: customerId,
        items: [{
          price: plan.priceId,
        }],
        metadata: {
          planKey,
          userId: options.userId
        },
        payment_behavior: 'default_incomplete',
        expand: ['latest_invoice.payment_intent'],
      };

      // Add trial period if specified
      if (options.trialDays) {
        subscriptionData.trial_period_days = options.trialDays;
      }

      // Add coupon if specified
      if (options.couponId) {
        subscriptionData.coupon = options.couponId;
      }

      const subscription = await this.stripe.subscriptions.create(subscriptionData);

      logger.info('Stripe subscription created', {
        subscriptionId: subscription.id,
        customerId,
        planKey,
        status: subscription.status
      });

      return subscription;
    } catch (error) {
      logger.error('Failed to create Stripe subscription', {
        customerId,
        planKey,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Cancel a subscription
   * @param {string} subscriptionId - Stripe subscription ID
   * @param {boolean} cancelAtPeriodEnd - Cancel at period end or immediately
   * @returns {Promise<Object>} Updated subscription object
   */
  async cancelSubscription(subscriptionId, cancelAtPeriodEnd = true) {
    try {
      const subscription = await this.stripe.subscriptions.update(subscriptionId, {
        cancel_at_period_end: cancelAtPeriodEnd,
      });

      logger.info('Stripe subscription cancelled', {
        subscriptionId,
        cancelAtPeriodEnd,
        status: subscription.status
      });

      return subscription;
    } catch (error) {
      logger.error('Failed to cancel Stripe subscription', {
        subscriptionId,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Update subscription plan
   * @param {string} subscriptionId - Stripe subscription ID
   * @param {string} newPlanKey - New plan key
   * @returns {Promise<Object>} Updated subscription object
   */
  async updateSubscriptionPlan(subscriptionId, newPlanKey) {
    try {
      const newPlan = this.plans[newPlanKey];
      if (!newPlan) {
        throw new Error(`Invalid plan key: ${newPlanKey}`);
      }

      const subscription = await this.stripe.subscriptions.retrieve(subscriptionId);
      const subscriptionItem = subscription.items.data[0];

      const updatedSubscription = await this.stripe.subscriptions.update(subscriptionId, {
        items: [{
          id: subscriptionItem.id,
          price: newPlan.priceId,
        }],
        proration_behavior: 'create_prorations',
      });

      logger.info('Stripe subscription plan updated', {
        subscriptionId,
        oldPlan: subscription.metadata.planKey,
        newPlan: newPlanKey
      });

      return updatedSubscription;
    } catch (error) {
      logger.error('Failed to update Stripe subscription plan', {
        subscriptionId,
        newPlanKey,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Handle Stripe webhook
   * @param {string} payload - Raw webhook payload
   * @param {string} signature - Stripe signature
   * @returns {Promise<Object>} Webhook event
   */
  async handleWebhook(payload, signature) {
    try {
      const event = this.stripe.webhooks.constructEvent(
        payload,
        signature,
        this.webhookSecret
      );

      logger.info('Stripe webhook received', {
        type: event.type,
        id: event.id
      });

      return event;
    } catch (error) {
      logger.error('Failed to handle Stripe webhook', {
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Create a payment intent for one-time payments
   * @param {Object} paymentData - Payment data
   * @returns {Promise<Object>} Payment intent
   */
  async createPaymentIntent(paymentData) {
    try {
      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: paymentData.amount,
        currency: paymentData.currency || 'usd',
        metadata: {
          userId: paymentData.userId,
          type: paymentData.type || 'one_time',
          description: paymentData.description
        },
        receipt_email: paymentData.email,
      });

      logger.info('Stripe payment intent created', {
        paymentIntentId: paymentIntent.id,
        amount: paymentData.amount,
        userId: paymentData.userId
      });

      return paymentIntent;
    } catch (error) {
      logger.error('Failed to create Stripe payment intent', {
        userId: paymentData.userId,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Get customer payment methods
   * @param {string} customerId - Stripe customer ID
   * @returns {Promise<Array>} Payment methods
   */
  async getCustomerPaymentMethods(customerId) {
    try {
      const paymentMethods = await this.stripe.paymentMethods.list({
        customer: customerId,
        type: 'card',
      });

      return paymentMethods.data;
    } catch (error) {
      logger.error('Failed to get customer payment methods', {
        customerId,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Create a coupon
   * @param {Object} couponData - Coupon data
   * @returns {Promise<Object>} Coupon object
   */
  async createCoupon(couponData) {
    try {
      const coupon = await this.stripe.coupons.create({
        percent_off: couponData.percentOff,
        duration: couponData.duration || 'once',
        duration_in_months: couponData.durationInMonths,
        metadata: {
          code: couponData.code,
          description: couponData.description
        }
      });

      logger.info('Stripe coupon created', {
        couponId: coupon.id,
        percentOff: couponData.percentOff,
        code: couponData.code
      });

      return coupon;
    } catch (error) {
      logger.error('Failed to create Stripe coupon', {
        code: couponData.code,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Get subscription details
   * @param {string} subscriptionId - Stripe subscription ID
   * @returns {Promise<Object>} Subscription object
   */
  async getSubscription(subscriptionId) {
    try {
      const subscription = await this.stripe.subscriptions.retrieve(subscriptionId);
      return subscription;
    } catch (error) {
      logger.error('Failed to get Stripe subscription', {
        subscriptionId,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Get customer details
   * @param {string} customerId - Stripe customer ID
   * @returns {Promise<Object>} Customer object
   */
  async getCustomer(customerId) {
    try {
      const customer = await this.stripe.customers.retrieve(customerId);
      return customer;
    } catch (error) {
      logger.error('Failed to get Stripe customer', {
        customerId,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * List customer subscriptions
   * @param {string} customerId - Stripe customer ID
   * @returns {Promise<Array>} Subscriptions array
   */
  async listCustomerSubscriptions(customerId) {
    try {
      const subscriptions = await this.stripe.subscriptions.list({
        customer: customerId,
        status: 'all',
        limit: 100
      });

      return subscriptions.data;
    } catch (error) {
      logger.error('Failed to list customer subscriptions', {
        customerId,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Get available plans
   * @returns {Object} Plans configuration
   */
  getPlans() {
    return this.plans;
  }

  /**
   * Check if service is initialized
   * @returns {boolean} Initialization status
   */
  isReady() {
    return this.isInitialized;
  }

  /**
   * Health check for Stripe service
   * @returns {Promise<Object>} Health status
   */
  async healthCheck() {
    try {
      // Test API connectivity
      await this.stripe.balance.retrieve();

      return {
        status: 'healthy',
        service: 'stripe',
        initialized: this.isInitialized,
        plansCount: Object.keys(this.plans).length,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      logger.error('Stripe health check failed', { error: error.message });
      return {
        status: 'unhealthy',
        service: 'stripe',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }
}

module.exports = StripeService;