// Main Auth Wrapper
// Layout logic is handled in specific route layouts (login/layout.tsx and register/layout.tsx)
// This file serves as a root provider/metadata wrapper if needed.

import { headers } from 'next/headers';
import { unstable_noStore as noStore } from 'next/cache';
import { AuthTransitionLayout, generateParticles } from '@/features/auth';

export default async function AuthLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>): Promise<React.JSX.Element> {
    noStore(); // Opt out of static rendering
    await headers(); // Force dynamic rendering context for Math.random()
    const particles = generateParticles();

    return (
        <AuthTransitionLayout particles={particles}>
            {children}
        </AuthTransitionLayout>
    );
}
