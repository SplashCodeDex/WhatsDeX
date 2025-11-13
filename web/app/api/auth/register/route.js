import { NextResponse } from 'next/server';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

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

    // Proxy registration to API server
    const resp = await fetch(`${API_BASE}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        companyName,
        subdomain,
        email,
        name,
        password,
        phone,
        plan
      })
    });

    const contentType = resp.headers.get('content-type') || '';
    let data;
    if (contentType.includes('application/json')) {
      data = await resp.json();
    } else {
      const text = await resp.text();
      // Return helpful diagnostics when upstream returns non-JSON
      return NextResponse.json({
        error: 'Upstream registration endpoint returned non-JSON response',
        upstreamStatus: resp.status,
        upstreamContentType: contentType,
        upstreamBodyPreview: text.slice(0, 200)
      }, { status: 502 });
    }

    return NextResponse.json(data, { status: resp.status });

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