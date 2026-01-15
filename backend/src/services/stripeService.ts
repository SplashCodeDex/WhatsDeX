import Stripe from 'stripe';
import { ConfigService } from './ConfigService.js';

export class StripeService {
  private static instance: StripeService | null = null;
  public readonly stripe: Stripe;

  private constructor() {
    const config = ConfigService.getInstance();
    const secretKey = config.get('STRIPE_SECRET_KEY');

    if (!secretKey) {
      throw new Error('STRIPE_SECRET_KEY is not configured');
    }

    this.stripe = new Stripe(secretKey, {
      apiVersion: '2025-01-27.acacia',
    });
  }

  public static getInstance(): StripeService {
    if (!StripeService.instance) {
      StripeService.instance = new StripeService();
    }
    return StripeService.instance;
  }

  /**
   * Resets the singleton instance (primarily for testing purposes)
   */
  public static resetInstance(): void {
    StripeService.instance = null;
  }
}
