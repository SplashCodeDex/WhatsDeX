import Link from 'next/link';

import { Button } from '@/components/ui/button';

export default function HomePage(): React.JSX.Element {
    return (
        <div className="flex min-h-screen flex-col">
            {/* Hero Section */}
            <section className="relative flex flex-1 flex-col items-center justify-center px-4 py-24">
                {/* Background gradient */}
                <div className="absolute inset-0 -z-10 bg-gradient-to-b from-primary-50 via-background to-background dark:from-primary-950/20" />

                {/* Glow effect */}
                <div className="absolute left-1/2 top-0 -z-10 h-[500px] w-[500px] -translate-x-1/2 rounded-full bg-primary-500/20 blur-[100px]" />

                <div className="mx-auto max-w-4xl text-center">
                    {/* Badge */}
                    <div className="mb-6 inline-flex items-center rounded-full border border-border bg-card px-4 py-1.5 text-sm font-medium text-muted-foreground shadow-sm">
                        <span className="mr-2 inline-block h-2 w-2 rounded-full bg-success" />
                        Now with Multi-Bot Support
                    </div>

                    {/* Heading */}
                    <h1 className="mb-6 text-4xl font-bold tracking-tight text-foreground sm:text-5xl md:text-6xl">
                        Manage Your WhatsApp Bots{' '}
                        <span className="bg-gradient-to-r from-primary-500 to-accent-500 bg-clip-text text-transparent">
                            Like a Pro
                        </span>
                    </h1>

                    {/* Subheading */}
                    <p className="mx-auto mb-10 max-w-2xl text-lg text-muted-foreground md:text-xl">
                        WhatsDeX is the all-in-one platform for creating, deploying, and
                        managing WhatsApp automation. Connect multiple accounts, automate
                        messages, and scale your communication effortlessly.
                    </p>

                    {/* CTA Buttons */}
                    <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
                        <Button size="lg" asChild>
                            <Link href="/register">Get Started Free</Link>
                        </Button>
                        <Button size="lg" variant="outline" asChild>
                            <Link href="/login">Sign In</Link>
                        </Button>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className="border-t border-border bg-muted/30 px-4 py-24">
                <div className="mx-auto max-w-6xl">
                    <div className="mb-16 text-center">
                        <h2 className="mb-4 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                            Everything You Need
                        </h2>
                        <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
                            Powerful features to supercharge your WhatsApp automation
                        </p>
                    </div>

                    <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                        {features.map((feature) => (
                            <div
                                key={feature.title}
                                className="rounded-xl border border-border bg-card p-6 shadow-sm transition-shadow hover:shadow-md"
                            >
                                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary-100 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400">
                                    {feature.icon}
                                </div>
                                <h3 className="mb-2 text-lg font-semibold text-foreground">
                                    {feature.title}
                                </h3>
                                <p className="text-muted-foreground">{feature.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="border-t border-border px-4 py-8">
                <div className="mx-auto flex max-w-6xl items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                        © 2026 WhatsDeX. All rights reserved.
                    </p>
                    <div className="flex gap-4">
                        <Link
                            href="/privacy"
                            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                        >
                            Privacy
                        </Link>
                        <Link
                            href="/terms"
                            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                        >
                            Terms
                        </Link>
                    </div>
                </div>
            </footer>
        </div>
    );
}

const features = [
    {
        title: 'Multi-Bot Management',
        description:
            'Connect and manage multiple WhatsApp accounts from a single dashboard.',
        icon: (
            <svg
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
            >
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                />
            </svg>
        ),
    },
    {
        title: 'Real-time Sync',
        description:
            'Messages sync instantly across all your devices and bots in real-time.',
        icon: (
            <svg
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
            >
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
            </svg>
        ),
    },
    {
        title: 'Automation Rules',
        description:
            'Set up powerful automation rules to respond to messages automatically.',
        icon: (
            <svg
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
            >
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                />
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
            </svg>
        ),
    },
    {
        title: 'Analytics Dashboard',
        description:
            'Track message delivery, engagement, and bot performance with detailed analytics.',
        icon: (
            <svg
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
            >
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
            </svg>
        ),
    },
    {
        title: 'Team Collaboration',
        description:
            'Invite team members and collaborate on bot management with role-based access.',
        icon: (
            <svg
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
            >
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                />
            </svg>
        ),
    },
    {
        title: 'Secure & Compliant',
        description:
            'Enterprise-grade security with end-to-end encryption and data compliance.',
        icon: (
            <svg
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
            >
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                />
            </svg>
        ),
    },
];
