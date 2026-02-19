import React from 'react';
import { CampaignDetail } from '@/features/messages/index';

interface CampaignPageProps {
    params: Promise<{ id: string }>;
}

export default async function CampaignPage({ params }: CampaignPageProps) {
    const { id } = await params;

    return (
        <div className="flex-1 overflow-auto bg-transparent">
            <CampaignDetail id={id} />
        </div>
    );
}
