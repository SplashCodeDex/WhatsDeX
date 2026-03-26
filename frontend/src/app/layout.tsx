import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';

import { Providers } from './providers';

import { LiquidGlassFilters } from '@/components/effects/LiquidGlassFilters';
import './globals.css';

const inter = Inter({
    subsets: ['latin'],
    variable: '--font-inter',
    display: 'swap',
});

export const metadata: Metadata = {
    title: {
        default: 'DeXMart - WhatsApp Bot Management Platform',
        template: '%s | DeXMart',
    },
    description:
        'Professional WhatsApp bot management dashboard. Create, deploy, and manage WhatsApp automation with ease.',
    keywords: [
        'WhatsApp',
        'bot',
        'automation',
        'messaging',
        'dashboard',
        'management',
    ],
    authors: [{ name: 'DeXMart Team' }],
    creator: 'DeXMart',
    metadataBase: new URL(
        process.env.NEXT_PUBLIC_APP_URL ?? 'http://127.0.0.1:3000'
    ),
    openGraph: {
        type: 'website',
        locale: 'en_US',
        siteName: 'DeXMart',
        title: 'DeXMart - WhatsApp Bot Management Platform',
        description:
            'Professional WhatsApp bot management dashboard. Create, deploy, and manage WhatsApp automation with ease.',
    },
    twitter: {
        card: 'summary_large_image',
        title: 'DeXMart',
        description: 'Professional WhatsApp bot management platform',
    },
    robots: {
        index: true,
        follow: true,
    },
};

export const viewport: Viewport = {
    themeColor: [
        { media: '(prefers-color-scheme: light)', color: '#ffffff' },
        { media: '(prefers-color-scheme: dark)', color: '#0a0a0a' },
    ],
    width: 'device-width',
    initialScale: 1,
    maximumScale: 5,
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>): React.JSX.Element {
    return (
        <html lang="en" suppressHydrationWarning className={inter.variable}>
            <body className="min-h-screen bg-background antialiased">
                <LiquidGlassFilters />
                {/* Skip link for accessibility */}
                <a href="#main-content" className="skip-link">
                    Skip to main content
                </a>
                <Providers>
                    {children}
                </Providers>
            </body>
        </html>
    );
}
