import { type Metadata } from 'next';
import { ForgotPasswordForm } from '@/features/auth';

export const metadata: Metadata = {
    title: 'Reset Password | WhatsDeX',
    description: 'Enter your email to reset your password',
};

/**
 * Forgot Password Page
 * Thin wrapper around the ForgotPasswordForm component.
 */
export default function ForgotPasswordPage(): React.JSX.Element {
    return <ForgotPasswordForm />;
}
