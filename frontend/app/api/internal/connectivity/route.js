import { NextResponse } from 'next/server';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
const INTERNAL_API_KEY = process.env.INTERNAL_API_KEY || 'internal-api-key-change-in-production';

async function timedFetch(url, options = {}, timeoutMs = 8000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const resp = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(id);
    return resp;
  } catch (e) {
    clearTimeout(id);
    throw e;
  }
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const tenant = (searchParams.get('tenant') || 'localhost').trim().toLowerCase();

  const results = {};
  const headers = {
    'Content-Type': 'application/json',
    'x-internal-api-key': INTERNAL_API_KEY,
  };

  try {
    // 1) API base health
    try {
      const r = await timedFetch(`${API_BASE}/health`, { headers });
      results.health = { status: r.status, ok: r.ok };
    } catch (e) {
      results.health = { error: e.message };
    }

    // 2) Tenant lookup
    try {
      const r = await timedFetch(`${API_BASE}/api/internal/tenants/${tenant}`, { headers });
      const data = await r.json().catch(() => ({}));
      results.tenant = { status: r.status, ok: r.ok, data };
    } catch (e) {
      results.tenant = { error: e.message };
    }

    // 3) Plans check
    try {
      const r = await timedFetch(`${API_BASE}/api/internal/stripe/plans`, { headers });
      const data = await r.json().catch(() => ({}));
      results.plans = { status: r.status, ok: r.ok, dataCount: Array.isArray(data) ? data.length : undefined };
    } catch (e) {
      results.plans = { error: e.message };
    }

    // 4) Version endpoint (optional)
    try {
      const r = await timedFetch(`${API_BASE}/version`, { headers });
      results.version = { status: r.status, ok: r.ok };
    } catch (e) {
      results.version = { error: e.message };
    }

    return NextResponse.json({ success: true, apiBase: API_BASE, results });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
