import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';
import { APP_CONFIG } from '@/lib/constants/config';

export const metadata = {
    title: 'Privacy Policy - WhatsDeX',
    description: 'How we handle your data and protect your privacy.',
};

export default function PrivacyPage() {
    return (
        <div className="min-h-screen bg-background">
            {/* Navigation */}
            <nav className="border-b border-border bg-card/50 backdrop-blur-md sticky top-0 z-50">
                <div className="mx-auto max-w-4xl px-4 py-4 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-2 font-bold text-xl tracking-tight">
                        <span className="text-primary-500">Whats</span>
                        <span className="text-foreground">DeX</span>
                    </Link>
                    <Button variant="ghost" size="sm" asChild>
                        <Link href="/" className="flex items-center gap-2">
                            <ChevronLeft className="h-4 w-4" />
                            Back to Home
                        </Link>
                    </Button>
                </div>
            </nav>

            <main className="mx-auto max-w-3xl px-4 py-16">
                <h1 className="text-4xl font-bold tracking-tight text-foreground mb-8">Privacy Policy</h1>

                <div className="prose prose-slate dark:prose-invert max-w-none space-y-8">
                    <section>
                        <h2 className="text-2xl font-semibold text-foreground mb-4">1. Introduction</h2>
                        <p className="text-muted-foreground leading-relaxed">
                            At WhatsDeX, we take your privacy seriously. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our platform. Please read this privacy policy carefully. If you do not agree with the terms of this privacy policy, please do not access the site.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-foreground mb-4">2. Collection of Your Information</h2>
                        <p className="text-muted-foreground leading-relaxed">
                            We may collect information about you in a variety of ways. The information we may collect on the Site includes:
                        </p>
                        <ul className="list-disc pl-5 text-muted-foreground space-y-2 mt-4">
                            <li><strong>Personal Data:</strong> Name, email address, and account preferences when you register.</li>
                            <li><strong>WhatsApp Data:</strong> To provide our services, we process messages and contact information from your connected WhatsApp accounts. This data is handled with end-to-end encryption principles where applicable.</li>
                            <li><strong>Usage Data:</strong> Information about how you use our platform, including bot performance metrics and activity logs.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-foreground mb-4">3. Use of Your Information</h2>
                        <p className="text-muted-foreground leading-relaxed">
                            Having accurate information about you permits us to provide you with a smooth, efficient, and customized experience. Specifically, we may use information collected about you via the Site to:
                        </p>
                        <ul className="list-disc pl-5 text-muted-foreground space-y-2 mt-4">
                            <li>Create and manage your account.</li>
                            <li>Enable and manage your WhatsApp bot automations.</li>
                            <li>Perform analytics to improve our service performance.</li>
                            <li>Send you administrative information and updates.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-foreground mb-4">4. Security of Your Information</h2>
                        <p className="text-muted-foreground leading-relaxed">
                            We use administrative, technical, and physical security measures to help protect your personal information. While we have taken reasonable steps to secure the personal information you provide to us, please be aware that despite our efforts, no security measures are perfect or impenetrable, and no method of data transmission can be guaranteed against any interception or other type of misuse.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-foreground mb-4">5. Contact Us</h2>
                        <p className="text-muted-foreground leading-relaxed">
                            If you have questions or comments about this Privacy Policy, please contact us at {APP_CONFIG.contactEmail}.
                        </p>
                    </section>
                </div>

                <div className="mt-16 pt-8 border-t border-border text-center">
                    <p className="text-sm text-muted-foreground">
                        Last Updated: February 28, 2026
                    </p>
                </div>
            </main>
        </div>
    );
}
