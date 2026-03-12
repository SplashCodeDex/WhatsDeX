import { Metadata } from 'next';

import { LandingFeature } from '@/features/landing/LandingFeature';

export const metadata: Metadata = {
    title: 'DeXMart | Advanced WhatsApp Automation',
    description: 'Empower your business with AI-driven WhatsApp automation, multi-bot management, and real-time syncing.',
};

export default function HomePage() {
    return <LandingFeature />;
}
