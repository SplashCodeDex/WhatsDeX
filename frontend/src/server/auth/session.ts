import 'server-only';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(
    process.env.JWT_SECRET || 'fallback-secret-placeholder'
);

export async function getSession() {
    const cookieStore = await cookies();
    const token = cookieStore.get('token');
    return token?.value;
}

export async function requireAuth() {
    const token = await getSession();

    if (!token) {
        redirect('/login');
    }

    try {
        // Robust JWT Verification
        await jwtVerify(token, JWT_SECRET);
        return token;
    } catch (error: any) {
        if (error?.code === 'ERR_JWT_EXPIRED') {
            console.warn('[Session] Token expired, redirecting to login...');
        } else {
            console.error('[Session] Token verification failed:', error);
        }
        // Redirect to the logout route handler which CAN modify cookies
        // (Server Components can only read cookies, not modify them)
        redirect('/api/auth/logout');
    }
}
