import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Create Account',
    description: 'Create your WhatsDeX account',
};

export default function RegisterLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>): React.JSX.Element {
    return <>{children}</>;
}
