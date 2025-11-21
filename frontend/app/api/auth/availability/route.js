import { NextResponse } from 'next/server';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email') || '';
    const subdomain = searchParams.get('subdomain') || '';

    if (!email && !subdomain) {
      return NextResponse.json({ error: 'Provide email or subdomain to check' }, { status: 400 });
    }

    const resp = await fetch(`${API_BASE}/api/auth/register/availability?${new URLSearchParams({ email, subdomain })}`, {
      method: 'GET',
    });

    const data = await resp.json();
    return NextResponse.json(data, { status: resp.status });
  } catch (error) {
    console.error('Availability route error:', error);
    return NextResponse.json({ error: 'Failed to check availability' }, { status: 500 });
  }
}
