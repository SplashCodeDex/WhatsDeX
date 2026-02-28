import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';
import { APP_CONFIG } from '@/lib/constants/config';

export const metadata = {
    title: 'Terms of Service - WhatsDeX',
    description: 'The legal agreement for using the WhatsDeX platform.',
};

export default function TermsPage() {
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
                <h1 className="text-4xl font-bold tracking-tight text-foreground mb-8">Terms of Service</h1>

                <div className="prose prose-slate dark:prose-invert max-w-none space-y-8">
                    <section>
                        <h2 className="text-2xl font-semibold text-foreground mb-4">1. Acceptance of Terms</h2>
                        <p className="text-muted-foreground leading-relaxed">
                            By accessing or using WhatsDeX, you agree to be bound by these Terms of Service. If you do not agree to all the terms and conditions, you are prohibited from using the service.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-foreground mb-4">2. Description of Service</h2>
                        <p className="text-muted-foreground leading-relaxed">
                            WhatsDeX provides an AI-powered WhatsApp automation and management platform. We reserve the right to modify or discontinue the service with or without notice.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-foreground mb-4">3. User Responsibilities</h2>
                        <p className="text-muted-foreground leading-relaxed">
                            As a user of WhatsDeX, you agree to:
                        </p>
                        <ul className="list-disc pl-5 text-muted-foreground space-y-2 mt-4">
                            <li>Comply with WhatsApp's own Terms of Service.</li>
                            <li>Not use the platform for spamming, harassment, or illegal activities.</li>
                            <li>Maintain the security of your account credentials.</li>
                            <li>Be responsible for all activity that occurs under your account.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-foreground mb-4">4. Limitation of Liability</h2>
                        <p className="text-muted-foreground leading-relaxed">
                            WhatsDeX shall not be liable for any account bans, data loss, or indirect damages arising out of your use of the platform. The service is provided "as is" without warranty of any kind.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-foreground mb-4">5. Account Termination</h2>
                        <p className="text-muted-foreground leading-relaxed">
                            We reserve the right to terminate or suspend access to our service immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach the Terms.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-foreground mb-4">6. Contact Us</h2>
                        <p className="text-muted-foreground leading-relaxed">
                            If you have questions or comments about these Terms of Service, please contact us at {APP_CONFIG.contactEmail}.
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
