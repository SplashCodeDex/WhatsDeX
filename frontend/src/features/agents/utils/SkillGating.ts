import { type PlanTier } from '../types';
import { useAuthorityStore } from '@/stores/useAuthorityStore';

/**
 * Fallback static knowledge for "what-if" checks (upsell UI).
 * Used when the user is querying about a tier they are NOT currently on.
 */
const STATIC_TIER_SKILLS: Record<PlanTier, string[]> = {
    starter: [
        'basic_reply',
        'summarize',
        'translate',
    ],
    pro: [
        'basic_reply',
        'summarize',
        'translate',
        'web_search',
        'file_analysis',
        'image_generation',
    ],
    enterprise: [
        'basic_reply',
        'summarize',
        'translate',
        'web_search',
        'file_analysis',
        'image_generation',
        'custom_scripting',
        'database_query',
    ],
};

/**
 * Checks if a specific skill is allowed for a user's billing tier.
 * Delegates to System Authority for the current tier.
 */
export function isSkillAllowed(tier: PlanTier, skillId: string): boolean {
    const store = useAuthorityStore.getState();

    // If checking against the current user's tier, use the authoritative backend response
    if (store.tier === tier && store.capabilities) {
        return store.isSkillAllowed(skillId);
    }

    // Fallback to static knowledge
    const allowedSkills = STATIC_TIER_SKILLS[tier] || STATIC_TIER_SKILLS.starter;
    return allowedSkills.includes(skillId);
}

/**
 * Returns the list of skills allowed for a specific tier.
 */
export function getAllowedSkills(tier: PlanTier): string[] {
    const store = useAuthorityStore.getState();

    if (store.tier === tier && store.capabilities) {
        return store.capabilities.allowedSkills;
    }

    return STATIC_TIER_SKILLS[tier] || STATIC_TIER_SKILLS.starter;
}
