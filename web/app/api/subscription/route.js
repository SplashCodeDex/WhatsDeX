import { NextResponse } from 'next/server';
import multiTenantService from '../../../src/services/multiTenantService.js';
import multiTenantStripeService from '../../../src/services/multiTenantStripeService.js';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';

// Middleware to authenticate requests
async function authenticateRequest(request) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('Authentication token required');
  }

  const token = authHeader.substring(7);
  const decoded = jwt.verify(token, JWT_SECRET);
  
  return decoded;
}

// GET /api/subscription - Get current subscription info
export async function GET(request) {
  try {
    const user = await authenticateRequest(request);
    
    const tenant = await multiTenantService.getTenant(user.tenantId);
    if (!tenant) {
      return NextResponse.json(
        { error: 'Tenant not found' },
        { status: 404 }
      );
    }

    // Get current subscription
    const subscription = tenant.subscriptions?.[0];
    
    // Get plan details
    const plans = multiTenantStripeService.getAllPlans();
    const currentPlan = plans.find(p => p.id === tenant.plan);

    // Get usage stats
    const usage = {
      bots: await multiTenantService.getCurrentUsage(tenant.id, 'maxBots'),
      users: await multiTenantService.getCurrentUsage(tenant.id, 'maxUsers'),
      messages: await multiTenantService.getCurrentUsage(tenant.id, 'maxMessages')
    };

    const planLimits = JSON.parse(tenant.planLimits || '{}');

    return NextResponse.json({
      success: true,
      data: {
        tenant: {
          id: tenant.id,
          name: tenant.name,
          plan: tenant.plan,
          status: tenant.status
        },
        subscription: subscription || null,
        currentPlan,
        usage,
        limits: planLimits,
        plans
      }
    });

  } catch (error) {
    console.error('Get subscription error:', error);
    return NextResponse.json(
      { error: 'Failed to get subscription info' },
      { status: 500 }
    );
  }
}

// POST /api/subscription - Create or update subscription
export async function POST(request) {
  try {
    const user = await authenticateRequest(request);
    const body = await request.json();
    const { plan, paymentMethodId } = body;

    if (!plan || !paymentMethodId) {
      return NextResponse.json(
        { error: 'Plan and payment method are required' },
        { status: 400 }
      );
    }

    // Validate plan
    const plans = multiTenantStripeService.getAllPlans();
    const selectedPlan = plans.find(p => p.id === plan);
    if (!selectedPlan) {
      return NextResponse.json(
        { error: 'Invalid plan' },
        { status: 400 }
      );
    }

    // Create subscription
    const subscription = await multiTenantStripeService.createSubscription(
      user.tenantId,
      plan,
      paymentMethodId
    );

    // Log action
    await multiTenantService.logAction(
      user.tenantId,
      user.userId,
      'subscription_created',
      'subscription',
      subscription.id,
      { plan, amount: selectedPlan.price },
      request.headers.get('x-forwarded-for') || 'unknown',
      request.headers.get('user-agent')
    );

    // Record analytics
    await multiTenantService.recordAnalytic(
      user.tenantId,
      'subscription_created',
      selectedPlan.price,
      { plan }
    );

    return NextResponse.json({
      success: true,
      data: {
        subscription,
        plan: selectedPlan
      }
    });

  } catch (error) {
    console.error('Create subscription error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create subscription' },
      { status: 500 }
    );
  }
}

// DELETE /api/subscription - Cancel subscription
export async function DELETE(request) {
  try {
    const user = await authenticateRequest(request);
    const { searchParams } = new URL(request.url);
    const immediate = searchParams.get('immediate') === 'true';

    // Cancel subscription
    const canceledSubscription = await multiTenantStripeService.cancelSubscription(
      user.tenantId,
      immediate
    );

    // Log action
    await multiTenantService.logAction(
      user.tenantId,
      user.userId,
      'subscription_canceled',
      'subscription',
      canceledSubscription.id,
      { immediate },
      request.headers.get('x-forwarded-for') || 'unknown',
      request.headers.get('user-agent')
    );

    // Record analytics
    await multiTenantService.recordAnalytic(
      user.tenantId,
      'subscription_canceled',
      1,
      { immediate }
    );

    return NextResponse.json({
      success: true,
      data: {
        subscription: canceledSubscription,
        message: immediate 
          ? 'Subscription canceled immediately' 
          : 'Subscription will be canceled at the end of the billing period'
      }
    });

  } catch (error) {
    console.error('Cancel subscription error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to cancel subscription' },
      { status: 500 }
    );
  }
}