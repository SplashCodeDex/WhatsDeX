export default function NotFound(): React.JSX.Element {
    return (
        <div className="flex min-h-screen flex-col items-center justify-center px-4">
            <div className="text-center">
                <h1 className="mb-4 text-6xl font-bold text-foreground">404</h1>
                <h2 className="mb-4 text-2xl font-semibold text-foreground">
                    Page Not Found
                </h2>
                <p className="mb-8 text-muted-foreground">
                    The page you&apos;re looking for doesn&apos;t exist or has been moved.
                </p>
                <a
                    href="/"
                    className="inline-flex h-10 items-center justify-center rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-700"
                >
                    Go Home
                </a>
            </div>
        </div>
    );
}
