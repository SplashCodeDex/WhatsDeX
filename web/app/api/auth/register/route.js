import { NextResponse } from 'next/server';
import multiTenantService from '../../../../src/services/multiTenantService';
import multiTenantStripeService from '../../../../src/services/multiTenantStripeService';

export async function POST(request) {
  try {
    const body = await request.json();
    const { 
      companyName, 
      subdomain, 
      email, 
      name, 
      password, 
      phone,
      plan = 'free'
    } = body;

    // Validate required fields
    if (!companyName || !subdomain || !email || !name || !password) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate subdomain format
    const subdomainRegex = /^[a-z0-9-]+$/;
    if (!subdomainRegex.test(subdomain) || subdomain.length < 3 || subdomain.length > 20) {
      return NextResponse.json(
        { error: 'Invalid subdomain format. Use 3-20 lowercase letters, numbers, and hyphens only.' },
        { status: 400 }
      );
    }

    // Reserved subdomains
    const reservedSubdomains = ['www', 'api', 'app', 'admin', 'support', 'help', 'docs', 'blog'];
    if (reservedSubdomains.includes(subdomain)) {
      return NextResponse.json(
        { error: 'Subdomain is reserved' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Validate password strength
    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters long' },
        { status: 400 }
      );
    }

    // Create tenant and admin user
    const result = await multiTenantService.createTenant({
      name: companyName,
      subdomain,
      email,
      phone,
      adminUser: {
        email,
        name,
        password
      }
    });

    // If not free plan, we'll need to set up payment later
    // For now, everyone starts with free trial
    let stripeCustomer = null;
    if (plan !== 'free') {
      try {
        stripeCustomer = await multiTenantStripeService.createCustomer(
          result.tenant.id,
          { email, name: companyName, phone }
        );
      } catch (stripeError) {
        console.error('Failed to create Stripe customer:', stripeError);
        // Continue with registration, customer can be created later
      }
    }

    // Generate authentication token
    const authResult = await multiTenantService.authenticateUser(
      result.tenant.id,
      email,
      password
    );

    // Record analytics
    await multiTenantService.recordAnalytic(
      result.tenant.id,
      'tenant_registered',
      1,
      { plan, hasStripeCustomer: !!stripeCustomer }
    );

    // Log action
    await multiTenantService.logAction(
      result.tenant.id,
      result.user.id,
      'tenant_created',
      'tenant',
      result.tenant.id,
      { plan, subdomain },
      request.headers.get('x-forwarded-for') || 'unknown',
      request.headers.get('user-agent')
    );

    return NextResponse.json({
      success: true,
      data: {
        token: authResult.token,
        user: authResult.user,
        tenant: {
          ...authResult.tenant,
          stripeCustomerId: stripeCustomer?.id
        },
        botInstance: {
          id: result.botInstance.id,
          name: result.botInstance.name,
          status: result.botInstance.status
        }
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    
    if (error.message.includes('already taken') || error.message.includes('already exists')) {
      return NextResponse.json(
        { error: error.message },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: 'Registration failed. Please try again.' },
      { status: 500 }
    );
  }
}