import { Metadata } from 'next';
import React from 'react';

import { RegisterForm } from '@/features/auth';

export const metadata: Metadata = {
    title: 'Create Account',
    description: 'Create a new DeXMart account',
};

export default function RegisterPage(): React.JSX.Element {
    return <RegisterForm />;
}
