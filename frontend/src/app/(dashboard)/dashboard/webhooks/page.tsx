import { Metadata } from 'next';
import React from 'react';

import { WebhookManager } from '@/features/webhooks';

export const metadata: Metadata = {
    title: 'Webhooks | DeXMart',
    description: 'Manage external webhooks and system events delivery.',
};

export default function WebhooksPage(): React.JSX.Element {
    return (
        <div className="container mx-auto py-8">
            <WebhookManager />
        </div>
    );
}
