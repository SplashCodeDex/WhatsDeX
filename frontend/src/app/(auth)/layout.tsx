// Main Auth Wrapper
// Layout logic is handled in specific route layouts (login/layout.tsx and register/layout.tsx)
// This file serves as a root provider/metadata wrapper if needed.

export default function AuthLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>): React.JSX.Element {
    return <>{children}</>;
}
