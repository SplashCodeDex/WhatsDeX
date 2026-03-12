import logger from '@/utils/logger.js';
import { systemAuthorityService, PlanTier } from './SystemAuthorityService.js';

/**
 * Usage Guard Service (Legacy Proxy)
 *
 * @deprecated Use SystemAuthorityService directly.
 * This service now delegates to SystemAuthorityService to maintain backward compatibility
 * while we transition to the unified authority model.
 */
export class UsageGuard {
    private static instance: UsageGuard;

    private constructor() { }

    public static getInstance(): UsageGuard {
        if (!UsageGuard.instance) {
            UsageGuard.instance = new UsageGuard();
        }
        return UsageGuard.instance;
    }

    /**
     * Comprehensive check and increment for a tenant.
     * Delegates to systemAuthorityService.
     */
    public async checkAndIncrementUsage(tenantId: string): Promise<{ allowed: boolean; error?: string }> {
        const result = await systemAuthorityService.checkAuthority(tenantId, 'send_message');
        if (result.allowed) {
            await this.incrementUsage(tenantId);
        } else if (result.error === 'Monthly message limit reached') {
            // Align legacy error message for existing tests
            result.error = 'Monthly usage limit reached';
        }
        return result;
    }

    /**
     * Determines if a user can send more messages.
     * Delegates to systemAuthorityService.
     */
    public canSend(tier: PlanTier, currentMonthlyUsage: number): boolean {
        const caps = systemAuthorityService.getCapabilities(tier);
        return currentMonthlyUsage < caps.maxMessages;
    }

    /**
     * Increments the message usage for a tenant.
     * Delegates to systemAuthorityService.
     */
    public async incrementUsage(tenantId: string, amount: number = 1): Promise<void> {
        return systemAuthorityService.recordUsage(tenantId, 'messages', amount);
    }

    /**
     * Gets the monthly message limit for a specific tier.
     * Delegates to systemAuthorityService.
     */
    public getMonthlyLimit(tier: PlanTier): number {
        const caps = systemAuthorityService.getCapabilities(tier);
        return caps.maxMessages;
    }
}

export const usageGuard = UsageGuard.getInstance();
export { PlanTier };
