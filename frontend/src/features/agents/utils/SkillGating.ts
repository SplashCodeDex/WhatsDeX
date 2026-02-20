import { type PlanTier } from '../types';

/**
 * Defines which skills/tools are available for each billing tier.
 */
const TIER_SKILLS: Record<PlanTier, string[]> = {
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
 */
export function isSkillAllowed(tier: PlanTier, skillId: string): boolean {
    const allowedSkills = TIER_SKILLS[tier] || TIER_SKILLS.starter;
    return allowedSkills.includes(skillId);
}

/**
 * Returns the list of skills allowed for a specific tier.
 */
export function getAllowedSkills(tier: PlanTier): string[] {
    return TIER_SKILLS[tier] || TIER_SKILLS.starter;
}
