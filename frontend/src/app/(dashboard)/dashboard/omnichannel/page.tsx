import { OmnichannelFeature } from '@/features/omnichannel/OmnichannelFeature';
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Omnichannel Hub | DeXMart 2026',
    description: 'Central command for social messaging platforms.',
};

export default function OmnichannelHubPage() {
    return <OmnichannelFeature />;
}
