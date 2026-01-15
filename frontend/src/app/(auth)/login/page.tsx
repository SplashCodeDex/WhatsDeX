import { Metadata } from 'next';
import { LoginForm } from '@/features/auth';

export const metadata: Metadata = {
    title: 'Sign In',
    description: 'Sign in to your WhatsDeX account',
};

export default function LoginPage() {
    return <LoginForm />;
}
