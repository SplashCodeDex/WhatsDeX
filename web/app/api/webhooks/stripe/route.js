import { NextResponse } from 'next/server';
import multiTenantStripeService from '../../../../src/services/multiTenantStripeService.js';

export async function POST(request) {
  try {
    const body = await request.text();
    const signature = request.headers.get('stripe-signature');

    if (!signature) {
      return NextResponse.json(
        { error: 'Missing stripe signature' },
        { status: 400 }
      );
    }

    // Process webhook
    const result = await multiTenantStripeService.handleWebhook(body, signature);

    return NextResponse.json(result);

  } catch (error) {
    console.error('Stripe webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 400 }
    );
  }
}