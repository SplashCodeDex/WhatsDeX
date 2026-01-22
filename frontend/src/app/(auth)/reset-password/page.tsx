import { type Metadata } from 'next';
import { Suspense } from 'react';
import { ResetPasswordForm } from '@/features/auth';
import { Loader2 } from 'lucide-react';

export const metadata: Metadata = {
    title: 'Reset Password | WhatsDeX',
    description: 'Set your new account password',
};

/**
 * Reset Password Page
 * Hosts the ResetPasswordForm within a Suspense boundary (due to useSearchParams).
 */
export default function ResetPasswordPage(): React.JSX.Element {
    return (
        <Suspense
            fallback={
                <div className="flex items-center justify-center p-8">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            }
        >
            <ResetPasswordForm />
        </Suspense>
    );
}
