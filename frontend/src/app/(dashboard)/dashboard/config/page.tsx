import { Metadata } from 'next';
import { ConfigManager } from '@/features/config';

export const metadata: Metadata = {
    title: 'Platform Config | DeXMart',
    description: 'Manage tenant-wide settings and platform configuration.',
};

export default function ConfigPage() {
    return (
        <div className="container mx-auto py-8">
            <ConfigManager />
        </div>
    );
}
