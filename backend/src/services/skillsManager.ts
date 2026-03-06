// @ts-ignore
import { loadWorkspaceSkillEntries } from '../../../openclaw/src/agents/skills/workspace.js';
import { toolRegistry } from './toolRegistry.js';
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
   * Lists all available skills from the Unified Tool Registry.
   * This includes enriched schemas for FlowBuilder.
   */
  public async listAvailableSkills(): Promise<any[]> {
    try {
      // Use the Unified Registry as the source of truth for "active" skills
      const tools = toolRegistry.getAllTools();

      // Also get the status report for installation/dependency info
      const statusEntries = await (loadWorkspaceSkillEntries as any)();

      return tools.map(tool => {
        const status = statusEntries.find((s: any) => s.name === tool.name || s.skillKey === tool.name);
        return {
          id: String(tool.name),
          name: String(tool.name),
          description: String(tool.description),
          parameters: tool.parameters,
          source: tool.source,
          category: tool.category || (tool.source === 'openclaw' ? 'Intelligence' : 'System'),
          emoji: status?.emoji || (tool.source === 'openclaw' ? '🧠' : '⚙️'),
          status: status ? {
            disabled: status.disabled,
            missing: status.missing,
            install: status.install
          } : undefined
        };
      });
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
