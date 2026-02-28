import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { redirect } from 'next/navigation';

/**
 * Logout Route Handler
 *
 * Route Handlers CAN modify cookies (unlike Server Components).
 * - GET: Used by server-side redirects (e.g., requireAuth on JWT failure) → redirects to /login
 * - POST: Used by client-side fetch (e.g., useAuth logout button) → returns JSON response
 */
export async function GET() {
    const cookieStore = await cookies();
    cookieStore.delete('token');
    redirect('/login');
}

export async function POST() {
    const cookieStore = await cookies();
    cookieStore.delete('token');
    return NextResponse.json({ success: true });
}
