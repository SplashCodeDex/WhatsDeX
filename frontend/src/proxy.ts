import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Proxy (Next.js 16)
 *
 * Provides optimistic authentication redirects.
 * Deep verification is still handled by Server Components (requireAuth).
 */

const PROTECTED_ROUTES = ['/dashboard'];
const AUTH_ROUTES = ['/login', '/register', '/forgot-password'];

export function proxy(request: NextRequest) {
    const token = request.cookies.get('token')?.value;
    const { pathname } = request.nextUrl;

    // 1. If trying to access a protected route without a token, redirect to login
    const isProtectedRoute = PROTECTED_ROUTES.some((route) => pathname.startsWith(route));
    if (isProtectedRoute && !token) {
        const url = new URL('/login', request.url);
        // Store the original path to redirect back after login
        url.searchParams.set('from', pathname);
        return NextResponse.redirect(url);
    }

    // 2. If trying to access an auth route with a token, redirect to dashboard
    const isAuthRoute = AUTH_ROUTES.some((route) => pathname === route);
    if (isAuthRoute && token) {
        return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    return NextResponse.next();
}

export const config = {
    // Only run proxy on routes that require auth checks or auth page redirects
    matcher: [
        '/dashboard/:path*',
        '/login',
        '/register',
        '/forgot-password'
    ],
};
