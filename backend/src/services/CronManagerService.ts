import logger from '@/utils/logger.js';

export type PlanTier = 'starter' | 'pro' | 'enterprise';

interface FrequencyValidationResult {
    allowed: boolean;
    message?: string;
}

const TIER_MIN_INTERVALS: Record<PlanTier, number> = {
    starter: 60 * 60 * 1000, // 1 hour
    pro: 15 * 60 * 1000,    // 15 mins
    enterprise: 1 * 60 * 1000, // 1 min
};

/**
 * Cron Manager Service
 * 
 * Enforces tiered frequency limits for scheduled auto-posts and background tasks.
 */
export class CronManagerService {
    private static instance: CronManagerService;

    private constructor() {}

    public static getInstance(): CronManagerService {
        if (!CronManagerService.instance) {
            CronManagerService.instance = new CronManagerService();
        }
        return CronManagerService.instance;
    }

    /**
     * Validates if the requested frequency is allowed for the user's tier.
     * @param tier User's billing plan tier
     * @param intervalMs Requested interval in milliseconds
     */
    public validateFrequency(tier: PlanTier, intervalMs: number): FrequencyValidationResult {
        const minInterval = TIER_MIN_INTERVALS[tier] || TIER_MIN_INTERVALS.starter;

        if (intervalMs < minInterval) {
            const minDisplay = minInterval / (60 * 1000) >= 60 
                ? `${minInterval / (60 * 1000)} hour(s)` 
                : `${minInterval / (60 * 1000)} minutes`;

            const tierDisplay = tier.charAt(0).toUpperCase() + tier.slice(1);

            return {
                allowed: false,
                message: `Frequency too high. Your ${tierDisplay} plan allows a minimum interval of ${minDisplay}.`
            };
        }

        return { allowed: true };
    }
}

export const cronManagerService = CronManagerService.getInstance();
