import { LandingFeature } from '@/features/landing/LandingFeature';
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'DeXMart | Advanced WhatsApp Automation',
    description: 'Empower your business with AI-driven WhatsApp automation, multi-bot management, and real-time syncing.',
};

export default function HomePage() {
    return <LandingFeature />;
}
