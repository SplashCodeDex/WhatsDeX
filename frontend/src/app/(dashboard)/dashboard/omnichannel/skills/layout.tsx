import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Skills Store',
    description: 'Enhance your bots with powerful new capabilities',
};

export default function SkillsLayout({ children }: { children: React.ReactNode }) {
    return children;
}
