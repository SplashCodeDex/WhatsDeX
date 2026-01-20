import { Request, Response } from 'express';
import stripeService from '../services/stripeService.js';
import { db } from '../lib/firebase.js';
import logger from '../utils/logger.js';
import { ConfigService } from '../services/ConfigService.js';
import { Timestamp } from 'firebase-admin/firestore';

export const handleStripeWebhook = async (req: Request, res: Response) => {
  const sig = req.headers['stripe-signature'];
  const config = ConfigService.getInstance();
  const webhookSecret = config.get('STRIPE_WEBHOOK_SECRET');

  if (!sig || !webhookSecret) {
    logger.warn('Stripe webhook received without signature or secret');
    return res.status(400).json({ error: 'Missing signature or webhook secret' });
  }

  let event;

  try {
    if (!stripeService.stripe) {
      throw new Error('Stripe service not initialized');
    }
    // req.body must be the raw body for signature verification
    event = stripeService.stripe.webhooks.constructEvent(
      (req as any).rawBody || req.body,
      sig,
      webhookSecret
    );
  } catch (err: any) {
    logger.error('Stripe webhook signature verification failed', { error: err.message });
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Idempotency check: check if event has already been processed
  const eventRef = db.collection('stripe_events').doc(event.id);
  const eventDoc = await eventRef.get();

  if (eventDoc.exists) {
    logger.info('Stripe event already processed', { eventId: event.id });
    return res.json({ received: true, alreadyProcessed: true });
  }

  // Mark event as processing
  await eventRef.set({
    type: event.type,
    status: 'processing',
    createdAt: new Date(),
  });

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(event.data.object);
        break;
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object);
        break;
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object);
        break;
      default:
        logger.info(`Unhandled Stripe event type: ${event.type}`);
    }

    // Mark event as completed
    await eventRef.update({ status: 'completed', processedAt: new Date() });
    res.status(200).json({ received: true });
  } catch (err: any) {
    logger.error('Error processing Stripe event', { eventId: event.id, error: err.message });
    await eventRef.update({ status: 'failed', error: err.message });
    res.status(500).json({ error: 'Webhook handler failed' });
  }
};

const handleCheckoutSessionCompleted = async (session: any) => {
  logger.info('Handling checkout.session.completed', { sessionId: session.id });
  const { tenantId, userId, planId } = session.metadata || {};

  if (!tenantId) {
    logger.error('Missing tenantId in checkout session metadata', { sessionId: session.id });
    return;
  }

  const stripe = stripeService.stripe;
  const subscription = await stripe.subscriptions.retrieve(session.subscription as string);

  await db.collection('tenants').doc(tenantId).update({
    planTier: planId || 'starter',
    subscriptionStatus: subscription.status,
    stripeSubscriptionId: subscription.id,
    trialEndsAt: subscription.trial_end ? Timestamp.fromMillis(subscription.trial_end * 1000) : null,
    updatedAt: new Date(),
  });

  // Create/Update subscription record
  await db.collection('tenant_subscriptions').doc(subscription.id).set({
    id: subscription.id,
    tenantId,
    userId: userId || null,
    planTier: planId || 'starter',
    status: subscription.status,
    currentPeriodStart: subscription.current_period_start ? Timestamp.fromMillis((subscription as any).current_period_start * 1000) : Timestamp.now(),
    currentPeriodEnd: subscription.current_period_end ? Timestamp.fromMillis((subscription as any).current_period_end * 1000) : Timestamp.now(),
    cancelAtPeriodEnd: subscription.cancel_at_period_end || false,
    stripeCustomerId: session.customer as string,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
};

const handleSubscriptionUpdated = async (subscription: any) => {
  logger.info('Handling customer.subscription.updated', { subscriptionId: subscription.id });
  const { tenantId, planId } = subscription.metadata || {};

  if (!tenantId) {
    const tenantQuery = await db.collection('tenants').where('stripeSubscriptionId', '==', subscription.id).limit(1).get();
    if (tenantQuery.empty) {
      logger.error('Tenant not found for subscription updated', { subscriptionId: subscription.id });
      return;
    }
    const tenantDoc = tenantQuery.docs[0];

    await tenantDoc.ref.update({
      subscriptionStatus: subscription.status,
      trialEndsAt: subscription.trial_end ? Timestamp.fromMillis(subscription.trial_end * 1000) : null,
      updatedAt: new Date(),
    });
  } else {
    await db.collection('tenants').doc(tenantId).update({
      planTier: planId || 'starter',
      subscriptionStatus: subscription.status,
      trialEndsAt: subscription.trial_end ? Timestamp.fromMillis(subscription.trial_end * 1000) : null,
      updatedAt: new Date(),
    });
  }

  await db.collection('tenant_subscriptions').doc(subscription.id).update({
    status: subscription.status,
    currentPeriodStart: subscription.current_period_start ? Timestamp.fromMillis(subscription.current_period_start * 1000) : Timestamp.now(),
    currentPeriodEnd: subscription.current_period_end ? Timestamp.fromMillis(subscription.current_period_end * 1000) : Timestamp.now(),
    cancelAtPeriodEnd: subscription.cancel_at_period_end || false,
    updatedAt: new Date(),
  });
};

const handleSubscriptionDeleted = async (subscription: any) => {
  logger.info('Handling customer.subscription.deleted', { subscriptionId: subscription.id });

  const tenantQuery = await db.collection('tenants').where('stripeSubscriptionId', '==', subscription.id).limit(1).get();
  if (tenantQuery.empty) {
    logger.error('Tenant not found for subscription deleted', { subscriptionId: subscription.id });
    return;
  }

  const tenantDoc = tenantQuery.docs[0];
  await tenantDoc.ref.update({
    planTier: 'starter',
    subscriptionStatus: 'canceled',
    updatedAt: new Date(),
  });

  await db.collection('tenant_subscriptions').doc(subscription.id).update({
    status: 'canceled',
    updatedAt: new Date(),
  });
};
