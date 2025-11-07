import { NextResponse } from 'next/server';
import multiTenantService from '../../../lib/services/multiTenantService';

export async function POST(request) {
  try {
    const body = await request.json();
    const { email, password, subdomain } = body;

    // Validate required fields
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Extract tenant identifier
    let tenantIdentifier = subdomain;
    if (!tenantIdentifier) {
      // Try to extract from host header
      const host = request.headers.get('host') || '';
      tenantIdentifier = host.split('.')[0];
    }

    if (!tenantIdentifier) {
      return NextResponse.json(
        { error: 'Tenant identifier required' },
        { status: 400 }
      );
    }

    // Get tenant
    const tenant = await multiTenantService.getTenant(tenantIdentifier);
    if (!tenant) {
      return NextResponse.json(
        { error: 'Invalid tenant or credentials' },
        { status: 401 }
      );
    }

    if (tenant.status !== 'active') {
      return NextResponse.json(
        { error: 'Account suspended. Please contact support.' },
        { status: 403 }
      );
    }

    // Authenticate user
    const authResult = await multiTenantService.authenticateUser(
      tenant.id,
      email,
      password
    );

    // Record analytics
    await multiTenantService.recordAnalytic(
      tenant.id,
      'user_login',
      1,
      { userId: authResult.user.id, userRole: authResult.user.role }
    );

    // Log action
    await multiTenantService.logAction(
      tenant.id,
      authResult.user.id,
      'user_login',
      'user',
      authResult.user.id,
      { loginMethod: 'password' },
      request.headers.get('x-forwarded-for') || 'unknown',
      request.headers.get('user-agent')
    );

    return NextResponse.json({
      success: true,
      data: authResult
    });

  } catch (error) {
    console.error('Login error:', error);
    
    if (error.message.includes('Invalid credentials') || error.message.includes('not found')) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: 'Login failed. Please try again.' },
      { status: 500 }
    );
  }
}