import logger from '@/utils/logger.js';
import { systemAuthorityService, PlanTier } from './SystemAuthorityService.js';

interface FrequencyValidationResult {
    allowed: boolean;
    message?: string;
}

/**
 * Cron Manager Service
 * 
 * Enforces tiered frequency limits for scheduled auto-posts and background tasks.
 * Delegates to SystemAuthorityService for unified interval enforcement.
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
        const caps = systemAuthorityService.getCapabilities(tier);
        const minInterval = caps.minCronIntervalMs;

        if (intervalMs < minInterval) {
            const minDisplay = minInterval / (60 * 1000) >= 60 
                ? `${minInterval / (60 * 60 * 1000)} hour(s)` 
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
