import { type PlanTier } from '../types';
import { useAuthorityStore } from '@/stores/useAuthorityStore';

// Fallback static knowledge for "what-if" checks (upsell UI)
const STATIC_SLOT_LIMITS: Record<PlanTier, number> = {
    starter: 1,
    pro: 3,
    enterprise: 100,
};

/**
 * Utility to determine if a user can add another channel slot based on their billing tier.
 * Delegates to System Authority for the current tier.
 */
export function canAddChannelSlot(tier: PlanTier, currentCount: number): boolean {
    const limit = getSlotLimit(tier);
    return currentCount < limit;
}

/**
 * Gets the slot limit for a specific tier.
 */
export function getSlotLimit(tier: PlanTier): number {
    const store = useAuthorityStore.getState();
    
    // If checking against the current user's tier, use the authoritative backend response
    if (store.tier === tier && store.capabilities) {
        return store.getLimit('maxChannelSlots');
    }

    // Fallback to static knowledge for other tiers
    return STATIC_SLOT_LIMITS[tier] || 1;
}
