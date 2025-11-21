import { NextResponse } from 'next/server';

const ENABLE_CSRF = process.env.ENABLE_CSRF === 'true';

export function getCookie(name, cookieHeader = '') {
  const match = cookieHeader.match(new RegExp('(?:^|; )' + name + '=([^;]+)'));
  return match ? decodeURIComponent(match[1]) : null;
}

export function verifyCsrf(request) {
  if (!ENABLE_CSRF) return null; // CSRF disabled
  const headerToken = request.headers.get('x-csrf-token');
  const cookieHeader = request.headers.get('cookie') || '';
  const cookieToken = getCookie('csrf_token', cookieHeader);
  if (!headerToken || !cookieToken || headerToken !== cookieToken) {
    return NextResponse.json({ error: 'Invalid CSRF token' }, { status: 403 });
  }
  return null; // OK
}
