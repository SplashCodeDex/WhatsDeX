/**
 * Assets Showcase Page
 *
 * Visual verification page for all generated assets:
 * - Logos (4 variations)
 * - CSS Backgrounds (5 styles)
 * - SVG Icons (6 custom components)
 * - Combined examples
 */

import Image from 'next/image';
import {
    BotIcon,
    MessageAutomationIcon,
    AnalyticsIcon,
    ContactsIcon,
    CampaignIcon,
    QRCodeIcon
} from '@/components/ui/icons';
import '@/styles/backgrounds.css';

export default function AssetsPage() {
    return (
        <div className="space-y-12">
            <div>
                <h1 className="text-3xl font-bold">Asset Library</h1>
                <p className="text-muted-foreground mt-2">
                    Visual showcase of all generated brand assets
                </p>
            </div>

            {/* Logos Section */}
            <section>
                <h2 className="text-2xl font-semibold mb-6">Generated Logos</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <LogoCard
                        title="Minimalist"
                        description="Clean, flat design for app icons"
                        src="/assets/logos/minimal.png"
                    />
                    <LogoCard
                        title="Glassmorphism"
                        description="Premium 3D style for hero sections"
                        src="/assets/logos/glassmorphism.png"
                    />
                    <LogoCard
                        title="Typographic"
                        description="Professional wordmark for headers"
                        src="/assets/logos/typographic.png"
                    />
                    <LogoCard
                        title="Abstract"
                        description="Enterprise shield symbol"
                        src="/assets/logos/abstract.png"
                    />
                </div>
            </section>

            {/* App Icon */}
            <section>
                <h2 className="text-2xl font-semibold mb-6">App Icon</h2>
                <div className="bg-card border rounded-xl p-8 flex items-center justify-center">
                    <Image
                        src="/assets/icons/app-icon.png"
                        alt="WhatsDeX App Icon"
                        width={120}
                        height={120}
                        className="rounded-2xl shadow-lg"
                    />
                </div>
            </section>

            {/* CSS Backgrounds Section */}
            <section>
                <h2 className="text-2xl font-semibold mb-6">CSS Background Styles</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <BackgroundCard
                        title="Mesh Gradient"
                        className="bg-mesh-gradient"
                        code="bg-mesh-gradient"
                    />
                    <BackgroundCard
                        title="Glassmorphism Panel"
                        className="bg-glass-panel"
                        code="bg-glass-panel"
                    />
                    <BackgroundCard
                        title="Radial Burst"
                        className="bg-radial-burst"
                        code="bg-radial-burst"
                    />
                    <BackgroundCard
                        title="Grid Pattern"
                        className="bg-grid-pattern"
                        code="bg-grid-pattern"
                    />
                    <BackgroundCard
                        title="Wave Subtle"
                        className="bg-wave-subtle"
                        code="bg-wave-subtle"
                    />
                </div>
            </section>

            {/* SVG Icons Section */}
            <section>
                <h2 className="text-2xl font-semibold mb-6">Custom SVG Icons</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
                    <IconCard
                        title="Bot"
                        icon={<BotIcon size={48} color="oklch(58% 0.14 155)" />}
                    />
                    <IconCard
                        title="Automation"
                        icon={<MessageAutomationIcon size={48} color="oklch(58% 0.14 155)" />}
                    />
                    <IconCard
                        title="Analytics"
                        icon={<AnalyticsIcon size={48} color="oklch(58% 0.14 155)" />}
                    />
                    <IconCard
                        title="Contacts"
                        icon={<ContactsIcon size={48} color="oklch(58% 0.14 155)" />}
                    />
                    <IconCard
                        title="Campaign"
                        icon={<CampaignIcon size={48} color="oklch(58% 0.14 155)" />}
                    />
                    <IconCard
                        title="QR Code"
                        icon={<QRCodeIcon size={48} color="oklch(58% 0.14 155)" />}
                    />
                </div>
            </section>

            {/* Combined Examples */}
            <section>
                <h2 className="text-2xl font-semibold mb-6">Combined Examples</h2>
                <div className="space-y-6">
                    {/* Example 1: Hero Section */}
                    <div className="bg-radial-burst rounded-2xl overflow-hidden">
                        <div className="bg-glass-panel max-w-2xl mx-auto p-12 m-8 rounded-3xl">
                            <div className="flex items-center gap-4 mb-6">
                                <BotIcon size={48} color="#ffffff" />
                                <MessageAutomationIcon size={48} color="#ffffff" />
                            </div>
                            <h3 className="text-4xl font-bold text-white mb-4">WhatsDeX</h3>
                            <p className="text-white/80 text-lg">Enterprise WhatsApp Automation Platform</p>
                        </div>
                    </div>

                    {/* Example 2: Feature Cards */}
                    <div className="bg-mesh-gradient rounded-2xl p-8">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="bg-glass-panel p-6 rounded-xl">
                                <AnalyticsIcon size={32} color="oklch(58% 0.14 155)" />
                                <h4 className="font-semibold mt-4">Analytics</h4>
                                <p className="text-sm text-muted-foreground mt-2">
                                    Track metrics and insights
                                </p>
                            </div>
                            <div className="bg-glass-panel p-6 rounded-xl">
                                <CampaignIcon size={32} color="oklch(58% 0.14 155)" />
                                <h4 className="font-semibold mt-4">Campaigns</h4>
                                <p className="text-sm text-muted-foreground mt-2">
                                    Launch marketing automation
                                </p>
                            </div>
                            <div className="bg-glass-panel p-6 rounded-xl">
                                <ContactsIcon size={32} color="oklch(58% 0.14 155)" />
                                <h4 className="font-semibold mt-4">Contacts</h4>
                                <p className="text-sm text-muted-foreground mt-2">
                                    Manage your audience
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Hero Banner */}
            <section>
                <h2 className="text-2xl font-semibold mb-6">Hero Banner</h2>
                <div className="border rounded-xl overflow-hidden">
                    <Image
                        src="/assets/banners/hero-banner.png"
                        alt="WhatsDeX Hero Banner"
                        width={1200}
                        height={675}
                        className="w-full"
                    />
                </div>
            </section>

            {/* Feature Illustrations */}
            <section>
                <h2 className="text-2xl font-semibold mb-6">Feature Illustrations</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <IllustrationCard
                        title="Bot Automation"
                        description="Friendly robot managing WhatsApp automation"
                        src="/assets/illustrations/bot-automation.png"
                    />
                    <IllustrationCard
                        title="Analytics Dashboard"
                        description="Data visualization and metrics"
                        src="/assets/illustrations/analytics.png"
                    />
                    <IllustrationCard
                        title="Marketing Campaign"
                        description="Megaphone broadcasting messages"
                        src="/assets/illustrations/campaign.png"
                    />
                    <IllustrationCard
                        title="Contact Management"
                        description="Organized contact database"
                        src="/assets/illustrations/contacts.png"
                    />
                    <IllustrationCard
                        title="Enterprise Security"
                        description="Data protection shield"
                        src="/assets/illustrations/security.png"
                    />
                </div>
            </section>

            {/* Dashboard Backgrounds */}
            <section>
                <h2 className="text-2xl font-semibold mb-6">Dashboard Backgrounds</h2>
                <div className="grid grid-cols-1 gap-6">
                    <div className="border rounded-xl overflow-hidden">
                        <Image
                            src="/assets/backgrounds/dashboard-gradient.png"
                            alt="Dashboard Background Gradient"
                            width={1920}
                            height={1080}
                            className="w-full"
                        />
                        <div className="p-4 bg-card">
                            <h3 className="font-semibold">Gradient Mesh Background</h3>
                            <p className="text-sm text-muted-foreground mt-1">
                                Soft emerald to slate blue gradient for dashboard pages
                            </p>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}

// Helper Components

function LogoCard({ title, description, src }: { title: string; description: string; src: string }) {
    return (
        <div className="bg-card border rounded-xl p-6">
            <div className="aspect-square bg-muted rounded-lg flex items-center justify-center mb-4">
                <Image
                    src={src}
                    alt={title}
                    width={200}
                    height={200}
                    className="max-w-full max-h-full object-contain"
                />
            </div>
            <h3 className="font-semibold text-lg">{title}</h3>
            <p className="text-sm text-muted-foreground mt-1">{description}</p>
        </div>
    );
}

function BackgroundCard({ title, className, code }: { title: string; className: string; code: string }) {
    return (
        <div className="bg-card border rounded-xl overflow-hidden">
            <div className={`h-32 ${className}`} />
            <div className="p-4">
                <h3 className="font-semibold">{title}</h3>
                <code className="text-xs text-muted-foreground mt-2 block bg-muted px-2 py-1 rounded">
                    {code}
                </code>
            </div>
        </div>
    );
}

function IconCard({ title, icon }: { title: string; icon: React.ReactNode }) {
    return (
        <div className="bg-card border rounded-xl p-6 flex flex-col items-center justify-center text-center">
            <div className="mb-3">{icon}</div>
            <p className="text-sm font-medium">{title}</p>
        </div>
    );
}

function IllustrationCard({ title, description, src }: { title: string; description: string; src: string }) {
    return (
        <div className="bg-card border rounded-xl overflow-hidden">
            <div className="aspect-square bg-muted flex items-center justify-center p-6">
                <Image
                    src={src}
                    alt={title}
                    width={300}
                    height={300}
                    className="max-w-full max-h-full object-contain"
                />
            </div>
            <div className="p-4">
                <h3 className="font-semibold">{title}</h3>
                <p className="text-sm text-muted-foreground mt-1">{description}</p>
            </div>
        </div>
    );
}
