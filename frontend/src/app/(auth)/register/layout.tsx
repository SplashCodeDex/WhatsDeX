import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { unstable_noStore as noStore } from 'next/cache';
import { AnimatedAuthHero, generateParticles } from '@/features/auth';

export const metadata: Metadata = {
    title: 'Create Account',
    description: 'Create your WhatsDeX account',
};

export default async function RegisterLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>): Promise<React.JSX.Element> {
    noStore(); // Opt out of static rendering
    await headers(); // Force dynamic rendering context for Math.random()
    const particles = generateParticles();

    return (
        <div className="relative min-h-screen flex items-center justify-center overflow-hidden">
            {/* Full Screen Animated Background (No Text) */}
            <AnimatedAuthHero hideContent={true} particles={particles} />

            {/* Centered Content */}
            <div className="relative z-10 w-full max-w-lg px-4 sm:px-6">
                <div className="rounded-2xl bg-white/90 p-8 shadow-2xl backdrop-blur-sm sm:p-10">
                    {children}
                </div>
            </div>
        </div>
    );
}
