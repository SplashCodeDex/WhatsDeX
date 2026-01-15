export default function Loading(): React.JSX.Element {
    return (
        <div className="flex min-h-screen items-center justify-center">
            <div className="flex flex-col items-center gap-4">
                {/* Animated spinner */}
                <div className="relative h-12 w-12">
                    <div className="absolute inset-0 rounded-full border-4 border-muted" />
                    <div className="absolute inset-0 animate-spin rounded-full border-4 border-transparent border-t-primary-600" />
                </div>
                <p className="text-sm text-muted-foreground">Loading...</p>
            </div>
        </div>
    );
}
