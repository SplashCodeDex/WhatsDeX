import { type PlanTier } from '../types';

const SLOT_LIMITS: Record<PlanTier, number> = {
    starter: 1,
    pro: 3,
    enterprise: 100,
};

/**
 * Utility to determine if a user can add another channel slot based on their billing tier.
 */
export function canAddChannelSlot(tier: PlanTier, currentCount: number): boolean {
    const limit = SLOT_LIMITS[tier] || 1;
    return currentCount < limit;
}

/**
 * Gets the slot limit for a specific tier.
 */
export function getSlotLimit(tier: PlanTier): number {
    return SLOT_LIMITS[tier] || 1;
}
