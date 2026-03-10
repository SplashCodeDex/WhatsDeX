import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { decodeJwt, jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(
    process.env.JWT_SECRET || 'static-placeholder-do-not-use-in-prod-7f9d8a2b'
);

/**
 * Proxy (Next.js 16)
 *
 * Provides optimistic authentication redirects, CSRF protection, and RBAC.
 * Deep verification is also performed here to prevent redirect loops.
 */

const PROTECTED_ROUTES = ['/dashboard'];
const AUTH_ROUTES = ['/login', '/register', '/forgot-password'];
const ADMIN_ROUTES = ['/dashboard/settings']; // Routes requiring admin/owner role

// Ensure API requests come from our own origin
const ALLOWED_ORIGIN = process.env.NEXT_PUBLIC_APP_URL || 'http://127.0.0.1:3000';

interface JwtPayload {
    exp?: number;
    role?: string;
    [key: string]: any;
}

/**
 * Lightweight JWT Check
 */
function getTokenPayload(token: string): JwtPayload | null {
    try {
        return decodeJwt(token);
    } catch {
        return null;
    }
}

async function verifyToken(token: string): Promise<boolean> {
    try {
        await jwtVerify(token, JWT_SECRET);
        return true;
    } catch {
        return false;
    }
}

export async function proxy(request: NextRequest) {
    const token = request.cookies.get('token')?.value;
    const { pathname } = request.nextUrl;

    // ---------------------------------------------------------------------------
    // 1. CSRF Protection (API Routes)
    // ---------------------------------------------------------------------------
    if (pathname.startsWith('/api/') && ['POST', 'PUT', 'DELETE', 'PATCH'].includes(request.method)) {
        const origin = request.headers.get('origin');
        const referer = request.headers.get('referer');

        // CSRF Check: Ensure request comes from our own origin
        if ((origin && !origin.startsWith(ALLOWED_ORIGIN)) ||
            (!origin && referer && !referer.startsWith(ALLOWED_ORIGIN))) {
            return new NextResponse(JSON.stringify({ error: 'CSRF validation failed' }), {
                status: 403,
                headers: { 'Content-Type': 'application/json' }
            });
        }
    }

    const payload = token ? getTokenPayload(token) : null;
    const hasValidToken = token ? await verifyToken(token) : false;
    const userRole = payload?.role || 'viewer';

    // ---------------------------------------------------------------------------
    // 2. Auth Flow & Redirects
    // ---------------------------------------------------------------------------
    const isProtectedRoute = PROTECTED_ROUTES.some((route) => pathname.startsWith(route));
    if (isProtectedRoute && !hasValidToken) {
        const url = new URL('/login', request.url);
        url.searchParams.set('from', pathname);

        const response = NextResponse.redirect(url);
        // Clean up invalid/expired token if it exists
        if (token) {
            response.cookies.delete('token');
        }
        return response;
    }

    const isAuthRoute = AUTH_ROUTES.some((route) => pathname === route);
    if (isAuthRoute && hasValidToken) {
        return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    // ---------------------------------------------------------------------------
    // 3. RBAC (Role-Based Access Control)
    // ---------------------------------------------------------------------------
    if (isProtectedRoute && hasValidToken) {
        const isAdminRoute = ADMIN_ROUTES.some((route) => pathname.startsWith(route));
        if (isAdminRoute && userRole !== 'admin' && userRole !== 'owner') {
            // Role doesn't have access -> redirect to dashboard home
            return NextResponse.redirect(new URL('/dashboard', request.url));
        }
    }

    return NextResponse.next();
}

export const config = {
    // Only run proxy on protected/auth routes AND API routes for CSRF
    matcher: [
        '/dashboard/:path*',
        '/login',
        '/register',
        '/forgot-password',
        '/api/:path*'
    ],
};
