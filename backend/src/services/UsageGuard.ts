import logger from '@/utils/logger.js';
import { db } from '../lib/firebase.js';
import { Timestamp, FieldValue } from 'firebase-admin/firestore';

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

    private constructor() { }

    public static getInstance(): UsageGuard {
        if (!UsageGuard.instance) {
            UsageGuard.instance = new UsageGuard();
        }
        return UsageGuard.instance;
    }

    /**
     * Comprehensive check and increment for a tenant.
     * Use this before sending any message.
     */
    public async checkAndIncrementUsage(tenantId: string): Promise<{ allowed: boolean; error?: string }> {
        try {
            const tenantRef = db.doc(`tenants/${tenantId}`);
            const doc = await tenantRef.get();

            if (!doc.exists) {
                return { allowed: false, error: 'Tenant not found' };
            }

            const data = doc.data()!;
            const tier = (data.plan || 'starter') as PlanTier;
            const currentUsage = (data.stats?.totalMessagesSent || 0);

            if (!this.canSend(tier, currentUsage)) {
                return { allowed: false, error: 'Monthly usage limit reached' };
            }

            // Optimization: We could batch this or do it asynchronously if latency is a concern
            await this.incrementUsage(tenantId);
            return { allowed: true };
        } catch (error: any) {
            logger.error(`UsageGuard.checkAndIncrementUsage error for ${tenantId}:`, error);
            // Default to allowed on database error to avoid blocking users, but log it
            return { allowed: true };
        }
    }

    /**
     * Determines if a user can send more messages based on their tier and current monthly usage.
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
     * Increments the message usage for a tenant in Firestore.
     */
    public async incrementUsage(tenantId: string, amount: number = 1): Promise<void> {
        const today = new Date().toISOString().split('T')[0];
        const analyticsRef = db.doc(`tenants/${tenantId}/analytics/${today}`);
        const tenantRef = db.doc(`tenants/${tenantId}`);

        try {
            // Update both daily and total stats
            const batch = db.batch();
            
            batch.set(analyticsRef, {
                date: today,
                sent: FieldValue.increment(amount),
                updatedAt: Timestamp.now()
            }, { merge: true });

            batch.update(tenantRef, {
                'stats.totalMessagesSent': FieldValue.increment(amount),
                updatedAt: Timestamp.now()
            });

            await batch.commit();

            logger.debug(`Incremented message usage for tenant ${tenantId} by ${amount}`);
        } catch (error) {
            logger.error(`Failed to increment usage for tenant ${tenantId}:`, error);
        }
    }

    /**
     * Gets the monthly message limit for a specific tier.
     */
    public getMonthlyLimit(tier: PlanTier): number {
        return TIER_MONTHLY_LIMITS[tier] || TIER_MONTHLY_LIMITS.starter;
    }
}

export const usageGuard = UsageGuard.getInstance();
