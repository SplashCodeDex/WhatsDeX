import { NextResponse } from 'next/server';
import multiTenantService from '../../../../src/services/multiTenantService';
import jwt from 'jsonwebtoken';

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

    // Extract tenant identifier (support localhost with port and subdomains)
    let tenantIdentifier = (subdomain || '').trim().toLowerCase();

    // Normalize tenant identifier if provided via body
    if (tenantIdentifier) {
      tenantIdentifier = tenantIdentifier.replace(/^https?:\/\//, '');
      tenantIdentifier = tenantIdentifier.split('/')[0];
      tenantIdentifier = tenantIdentifier.split('#')[0];
      tenantIdentifier = tenantIdentifier.split('?')[0];
      const [hostPart] = tenantIdentifier.split(':'); // strip port
      const firstLabel = hostPart.split('.')[0];
      tenantIdentifier = firstLabel;
    }

    if (!tenantIdentifier) {
      const host = request.headers.get('host') || '';
      const [hostname] = host.split(':'); // strip port if present
      if (hostname === 'localhost' || hostname === '127.0.0.1') {
        tenantIdentifier = 'localhost';
      } else if (hostname) {
        const parts = hostname.split('.');
        tenantIdentifier = parts[0];
      }
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

    const token = jwt.sign(
      { userId: authResult.user.id, tenantId: tenant.id, email: authResult.user.email },
      process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production',
      { expiresIn: '7d' }
    );

    const response = NextResponse.json({
      success: true,
      user: {
        id: authResult.user.id,
        email: authResult.user.email,
        name: authResult.user.name,
        tenantId: tenant.id
      }
    });

    // Set httpOnly auth cookie
    response.cookies.set('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV !== 'development',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7 // 7 days
    });

    return response;

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