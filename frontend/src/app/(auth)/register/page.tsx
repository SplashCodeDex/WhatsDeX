import { Metadata } from 'next';
import { RegisterForm } from '@/features/auth';

export const metadata: Metadata = {
    title: 'Create Account',
    description: 'Create a new DeXMart account',
};

export default function RegisterPage() {
    return <RegisterForm />;
}
