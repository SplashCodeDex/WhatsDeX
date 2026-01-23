import type { Metadata, Viewport } from 'next';

import { Providers } from './providers';
import './globals.css';

export const metadata: Metadata = {
    title: {
        default: 'WhatsDeX - WhatsApp Bot Management Platform',
        template: '%s | WhatsDeX',
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
    authors: [{ name: 'WhatsDeX Team' }],
    creator: 'WhatsDeX',
    metadataBase: new URL(
        process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
    ),
    openGraph: {
        type: 'website',
        locale: 'en_US',
        siteName: 'WhatsDeX',
        title: 'WhatsDeX - WhatsApp Bot Management Platform',
        description:
            'Professional WhatsApp bot management dashboard. Create, deploy, and manage WhatsApp automation with ease.',
    },
    twitter: {
        card: 'summary_large_image',
        title: 'WhatsDeX',
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
        <html lang="en" suppressHydrationWarning>
            <head>
                {/* Preconnect to Google Fonts for performance */}
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link
                    rel="preconnect"
                    href="https://fonts.gstatic.com"
                    crossOrigin="anonymous"
                />
                {/* Inter Variable Font */}
                <link
                    href="https://fonts.googleapis.com/css2?family=Inter:wght@100..900&display=swap"
                    rel="stylesheet"
                />
            </head>
            <body className="min-h-screen bg-background antialiased">
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
