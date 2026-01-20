import { Request, Response } from 'express';
import stripeService from '../services/stripeService.js';
import { db } from '../lib/firebase.js';
import logger from '../utils/logger.js';
import { ConfigService } from '../services/ConfigService.js';

export const createCheckoutSession = async (req: Request, res: Response) => {
  try {
    const { planId, interval } = req.body;
    const user = (req as any).user;

    if (!planId || !interval) {
      return res.status(400).json({ error: 'planId and interval are required' });
    }

    if (!['starter', 'pro', 'enterprise'].includes(planId)) {
      return res.status(400).json({ error: 'Invalid planId' });
    }

    if (!['month', 'year'].includes(interval)) {
      return res.status(400).json({ error: 'Invalid interval' });
    }

    const tenantId = user.tenantId;
    const tenantRef = db.collection('tenants').doc(tenantId);
    const tenantDoc = await tenantRef.get();

    if (!tenantDoc.exists) {
      return res.status(404).json({ error: 'Tenant not found' });
    }

    const tenantData = tenantDoc.data()!;
    let stripeCustomerId = tenantData.stripeCustomerId;

    const stripe = stripeService.stripe;
    if (!stripe) {
      return res.status(503).json({ error: 'Stripe service not initialized' });
    }

    // Create Stripe customer if it doesn't exist
    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: {
          tenantId,
          userId: user.userId,
        },
      });
      stripeCustomerId = customer.id;
      await tenantRef.update({ stripeCustomerId });
    }

    // Find the price ID
    const prices = await stripe.prices.list({
      active: true,
      expand: ['data.product'],
    });

    const price = prices.data.find(
      (p) => p.metadata.planId === planId && p.metadata.type === interval
    );

    if (!price) {
      logger.error('Stripe price not found', { planId, interval });
      return res.status(500).json({ error: 'Price configuration not found in Stripe' });
    }

    const config = ConfigService.getInstance();
    const appUrl = config.get('NEXT_PUBLIC_APP_URL');

    // Create Checkout Session
    const session = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: price.id,
          quantity: 1,
        },
      ],
      subscription_data: {
        trial_period_days: 7,
        metadata: {
          tenantId,
          userId: user.userId,
          planId,
        },
      },
      success_url: `${appUrl}/dashboard/billing?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/dashboard/billing?canceled=true`,
    });

    res.json({ url: session.url });
  } catch (error: any) {
    logger.error('Error creating checkout session', { error: error.message });
    res.status(500).json({ error: 'Failed to create checkout session' });
  }
};

export const getSubscription = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const tenantId = user.tenantId;

    const tenantDoc = await db.collection('tenants').doc(tenantId).get();
    if (!tenantDoc.exists) {
      return res.status(404).json({ error: 'Tenant not found' });
    }

    const data = tenantDoc.data()!;
    res.json({
      planTier: data.planTier || 'starter',
      status: data.subscriptionStatus || 'trialing',
      trialEndsAt: data.trialEndsAt ? data.trialEndsAt.toDate().toISOString() : null,
      currentPeriodEnd: data.currentPeriodEnd ? data.currentPeriodEnd.toDate().toISOString() : null,
      cancelAtPeriodEnd: data.cancelAtPeriodEnd || false,
    });
  } catch (error: any) {
    logger.error('Error getting subscription', { error: error.message });
    res.status(500).json({ error: 'Failed to get subscription info' });
  }
};
