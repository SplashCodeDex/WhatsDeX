import type { Metadata } from 'next';
import { AnimatedAuthHero } from '@/features/auth';

export const metadata: Metadata = {
    title: 'Sign In',
    description: 'Sign in to your WhatsDeX account',
};

export default function AuthLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>): React.JSX.Element {
    return (
        <div className="flex min-h-screen">
            {/* Left side - Auth form */}
            <div className="flex flex-1 flex-col justify-center px-4 py-12 sm:px-6 lg:flex-none lg:px-20 xl:px-24">
                <div className="mx-auto w-full max-w-sm lg:w-96">{children}</div>
            </div>

            {/* Right side - Animated Hero */}
            <div className="relative hidden w-0 flex-1 lg:block">
                <AnimatedAuthHero />
            </div>
        </div>
    );
}
