import { NextRequest, NextResponse } from 'next/server';

const PROTECTED_ROUTES = ['/dashboard'];
const AUTH_ROUTES = ['/login', '/register', '/forgot-password', '/reset-password'];

/**
 * Middleware for route protection and session management
 */
export function middleware(request: NextRequest) {
    const token = request.cookies.get('token')?.value;
    const { pathname } = request.nextUrl;

    // 1. If trying to access a protected route without a token, redirect to login
    const isProtectedRoute = PROTECTED_ROUTES.some((route) => pathname.startsWith(route));
    if (isProtectedRoute && !token) {
        const url = new URL('/login', request.url);
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

/**
 * Configure which paths the middleware runs on
 */
export const config = {
    matcher: [
        '/dashboard/:path*',
        '/login',
        '/register',
        '/forgot-password',
        '/reset-password'
    ],
};
