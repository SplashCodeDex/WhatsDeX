import { loadWorkspaceSkillEntries } from '../../../../openclaw/src/agents/skills/workspace.js';
import logger from '@/utils/logger.js';

/**
 * SkillsManager wraps OpenClaw's skills platform and handles
 * tier-based gating for WhatsDeX tenants.
 */
export class SkillsManager {
  private static instance: SkillsManager;

  private constructor() {}

  public static getInstance(): SkillsManager {
    if (!SkillsManager.instance) {
      SkillsManager.instance = new SkillsManager();
    }
    return SkillsManager.instance;
  }

  /**
   * Lists all available skills from OpenClaw.
   */
  public async listAvailableSkills(): Promise<any[]> {
    try {
      const skills = await (loadWorkspaceSkillEntries as any)();
      return skills;
    } catch (error) {
      logger.error('Failed to list available skills:', error);
      return [];
    }
  }

  /**
   * Checks if a tenant is eligible for a specific skill based on their tier.
   */
  public async isTenantEligible(tenantId: string, skillId: string, tier: 'starter' | 'pro' | 'enterprise'): Promise<boolean> {
    // Define premium-only skills
    const premiumSkills = ['web-search', 'firecrawl', 'brave-search', 'perplexity'];
    
    if (premiumSkills.includes(skillId)) {
      return tier === 'pro' || tier === 'enterprise';
    }

    // Enterprise-only skills
    const enterpriseSkills = ['coding-agent', 'custom-hooks'];
    if (enterpriseSkills.includes(skillId)) {
      return tier === 'enterprise';
    }

    // Default: all tiers have access to basic skills
    return true;
  }
}

export const skillsManager = SkillsManager.getInstance();
