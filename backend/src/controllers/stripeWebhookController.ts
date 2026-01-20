import { Request, Response } from 'express';
import stripeService from '../services/stripeService.js';
import { db } from '../lib/firebase.js';
import logger from '../utils/logger.js';
import { ConfigService } from '../services/ConfigService.js';

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
  // Implementation will follow in next tasks
};

const handleSubscriptionUpdated = async (subscription: any) => {
  logger.info('Handling customer.subscription.updated', { subscriptionId: subscription.id });
  // Implementation will follow in next tasks
};

const handleSubscriptionDeleted = async (subscription: any) => {
  logger.info('Handling customer.subscription.deleted', { subscriptionId: subscription.id });
  // Implementation will follow in next tasks
};