import React from 'react';

import { Metadata } from 'next';

import { LoginForm } from '@/features/auth';

export const metadata: Metadata = {
    title: 'Sign In',
    description: 'Sign in to your DeXMart account',
};

export default function LoginPage(): React.JSX.Element {
    return <LoginForm />;
}
