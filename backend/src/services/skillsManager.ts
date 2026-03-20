// @ts-ignore
import { loadWorkspaceSkillEntries } from 'openclaw/agents/skills/workspace';
import { toolRegistry } from './toolRegistry.js';
import logger from '@/utils/logger.js';
import { systemAuthorityService, PlanTier } from './SystemAuthorityService.js';

/**
 * SkillsManager wraps OpenClaw's skills platform and handles
 * tier-based gating for DeXMart tenants.
 */
export class SkillsManager {
  private static instance: SkillsManager;

  private constructor() { }

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
  public async listAvailableSkills(tenantId?: string): Promise<any[]> {
    try {
      // Use the Unified Registry as the source of truth for "active" skills
      const tools = toolRegistry.getAllTools();

      // Also get the status report for installation/dependency info
      const statusEntries = await loadWorkspaceSkillEntries(process.cwd());

      // Get tenant-specific skill configuration if available
      let skillsConfig: Record<string, { enabled: boolean }> = {};
      let tier: PlanTier = 'starter';

      if (tenantId) {
        const { db } = await import('../lib/firebase.js');
        const tenantDoc = await db.collection('tenants').doc(tenantId).get();
        const data = tenantDoc.data();
        skillsConfig = data?.skillsConfig || {};
        tier = (data?.plan || 'starter') as PlanTier;
      }

      const caps = systemAuthorityService.getCapabilities(tier);

      return tools.map(tool => {
        const id = String(tool.name);
        const status = statusEntries.find((s: any) => s.skill?.name === id || s.metadata?.skillKey === id);
        const config = skillsConfig[id];

        // Determine required tier by checking where this skill first appears in the matrix
        let requiredTier: PlanTier = 'starter';
        if (!systemAuthorityService.isSkillAllowed('starter', id)) {
          requiredTier = systemAuthorityService.isSkillAllowed('pro', id) ? 'pro' : 'enterprise';
        }

        return {
          id,
          name: id,
          description: String(tool.description),
          parameters: tool.parameters,
          source: tool.source,
          category: tool.category || (tool.source === 'openclaw' ? 'Intelligence' : 'System'),
          emoji: status?.metadata?.emoji || (tool.source === 'openclaw' ? '🧠' : '⚙️'),
          enabled: config !== undefined ? config.enabled : false, // Default to false (Disabled by Default)
          requiredTier,
          status: status ? {
            disabled: config !== undefined ? !config.enabled : true,
            install: status.metadata?.install
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
  public async isTenantEligible(tenantId: string, skillId: string, tier?: PlanTier): Promise<boolean> {
    if (!tier) {
      const { db } = await import('../lib/firebase.js');
      const doc = await db.collection('tenants').doc(tenantId).get();
      tier = (doc.data()?.plan || 'starter') as PlanTier;
    }
    return systemAuthorityService.isSkillAllowed(tier, skillId);
  }

  /**
   * Securely execute a skill after verifying authority
   */
  public async executeSecureSkill(tenantId: string, skillId: string, params: any, context: any): Promise<Result<any>> {
    try {
      // 1. Gating Check
      const eligible = await this.isTenantEligible(tenantId, skillId);
      if (!eligible) {
        return { success: false, error: new Error(`UNAUTHORIZED_SKILL: Your current plan does not include the '${skillId}' skill.`) };
      }

      // 2. Execution
      return await toolRegistry.executeTool(skillId, params, context);
    } catch (error: any) {
      return { success: false, error };
    }
  }

  /**
   * Toggles a skill for a specific tenant.
   */
  public async toggleSkill(tenantId: string, skillId: string, enabled: boolean): Promise<any> {
    try {
      const { db } = await import('../lib/firebase.js');
      const tenantRef = db.collection('tenants').doc(tenantId);

      const doc = await tenantRef.get();
      if (!doc.exists) throw new Error('Tenant not found');

      const currentSkills = doc.data()?.skillsConfig || {};

      await tenantRef.set({
        skillsConfig: {
          ...currentSkills,
          [skillId]: { enabled }
        }
      }, { merge: true });

      logger.info(`Skill [${skillId}] ${enabled ? 'enabled' : 'disabled'} for tenant ${tenantId}`);
      return { skillId, enabled };
    } catch (error) {
      logger.error(`Failed to toggle skill ${skillId}:`, error);
      throw error;
    }
  }
}

export const skillsManager = SkillsManager.getInstance();
