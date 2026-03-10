import { HomeFeature } from '@/features/dashboard/HomeFeature';
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Dashboard | DeXMart 2026',
    description: 'Autonomous commerce engine status and control.',
};

export default function DashboardPage() {
    return <HomeFeature />;
}
