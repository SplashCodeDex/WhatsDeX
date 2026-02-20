import logger from '@/utils/logger.js';

export type PlanTier = 'starter' | 'pro' | 'enterprise';

const TIER_MONTHLY_LIMITS: Record<PlanTier, number> = {
    starter: 1000,
    pro: 10000,
    enterprise: 10000000, // 10M for Enterprise
};

/**
 * Usage Guard Service
 * 
 * Enforces monthly message volume limits based on the user's billing tier.
 */
export class UsageGuard {
    private static instance: UsageGuard;

    private constructor() {}

    public static getInstance(): UsageGuard {
        if (!UsageGuard.instance) {
            UsageGuard.instance = new UsageGuard();
        }
        return UsageGuard.instance;
    }

    /**
     * Determines if a user can send more messages based on their tier and current monthly usage.
     * @param tier User's billing plan tier
     * @param currentMonthlyUsage Total messages sent by the user this month
     */
    public canSend(tier: PlanTier, currentMonthlyUsage: number): boolean {
        const limit = TIER_MONTHLY_LIMITS[tier] || TIER_MONTHLY_LIMITS.starter;
        
        if (currentMonthlyUsage >= limit) {
            logger.warn(`Usage limit reached for tier ${tier}. Current: ${currentMonthlyUsage}, Limit: ${limit}`);
            return false;
        }

        return true;
    }

    /**
     * Gets the monthly message limit for a specific tier.
     */
    public getMonthlyLimit(tier: PlanTier): number {
        return TIER_MONTHLY_LIMITS[tier] || TIER_MONTHLY_LIMITS.starter;
    }
}

export const usageGuard = UsageGuard.getInstance();
