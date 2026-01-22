import { InteractiveAuthProgressBar } from '@/features/auth';

/**
 * Dashboard Loading Page
 * Uses the InteractiveAuthProgressBar for a premium transition into the admin area.
 */
export default function DashboardLoading(): React.JSX.Element {
    return (
        <div className="flex min-h-[60vh] items-center justify-center">
            <InteractiveAuthProgressBar />
        </div>
    );
}
