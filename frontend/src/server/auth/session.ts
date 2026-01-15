import 'server-only';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

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

    return token;
}
