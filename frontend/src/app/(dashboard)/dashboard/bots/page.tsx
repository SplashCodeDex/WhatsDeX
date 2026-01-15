import { Metadata } from 'next';
import { BotList } from '@/features/bots';

export const metadata: Metadata = {
    title: 'My Bots',
    description: 'Manage your WhatsApp bot instances',
};

export default function BotsPage() {
    return <BotList />;
}
