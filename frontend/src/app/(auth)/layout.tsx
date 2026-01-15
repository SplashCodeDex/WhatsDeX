import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Sign In',
    description: 'Sign in to your WhatsDeX account',
};

export default function AuthLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>): React.JSX.Element {
    return (
        <div className="flex min-h-screen">
            {/* Left side - Auth form */}
            <div className="flex flex-1 flex-col justify-center px-4 py-12 sm:px-6 lg:flex-none lg:px-20 xl:px-24">
                <div className="mx-auto w-full max-w-sm lg:w-96">{children}</div>
            </div>

            {/* Right side - Decorative */}
            <div className="relative hidden w-0 flex-1 lg:block">
                <div className="absolute inset-0 bg-gradient-to-br from-primary-600 via-primary-700 to-accent-600">
                    {/* Pattern overlay */}
                    <div
                        className="absolute inset-0 opacity-10"
                        style={{
                            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                        }}
                    />
                    {/* Glow effects */}
                    <div className="absolute left-1/4 top-1/4 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
                    <div className="absolute bottom-1/4 right-1/4 h-64 w-64 rounded-full bg-accent-400/20 blur-3xl" />
                </div>

                {/* Branding */}
                <div className="absolute inset-0 flex flex-col items-center justify-center p-12 text-white">
                    <div className="max-w-md text-center">
                        <h2 className="mb-4 text-3xl font-bold">Welcome to WhatsDeX</h2>
                        <p className="text-lg text-white/80">
                            The most powerful WhatsApp bot management platform. Connect,
                            automate, and scale your messaging effortlessly.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
