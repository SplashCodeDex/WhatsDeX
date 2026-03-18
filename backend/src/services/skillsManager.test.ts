import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SkillsManager } from './skillsManager.js';
import { toolRegistry } from './toolRegistry.js';
import { systemAuthorityService } from './SystemAuthorityService.js';

// Mock toolRegistry
vi.mock('./toolRegistry.js', () => ({
  toolRegistry: {
    getAllTools: vi.fn().mockReturnValue([
      { name: 'web-search', description: 'Search the web', parameters: {}, source: 'openclaw' },
      { name: 'math', description: 'Do math', parameters: {}, source: 'openclaw' }
    ])
  }
}));

// Mock openclaw skills
vi.mock('openclaw/agents/skills/workspace', () => ({
  loadWorkspaceSkillEntries: vi.fn().mockResolvedValue([
    { id: 'web-search', metadata: { title: 'Web Search' } },
    { id: 'math', metadata: { title: 'Mathematics' } }
  ])
}));

// Mock systemAuthorityService
vi.mock('./SystemAuthorityService.js', () => ({
  systemAuthorityService: {
    isSkillAllowed: vi.fn((tier, skillId) => {
      // Basic mock logic matching SystemAuthorityService.ts defaults
      if (skillId === 'web-search') return tier === 'pro' || tier === 'enterprise';
      return true;
    }),
    getCapabilities: vi.fn((tier) => ({
      allowedSkills: tier === 'starter' ? ['math'] : ['web-search', 'math']
    }))
  }
}));

describe('SkillsManager', () => {
  let manager: SkillsManager;

  beforeEach(() => {
    vi.clearAllMocks();
    // @ts-ignore
    SkillsManager.instance = undefined;
    manager = SkillsManager.getInstance();
  });

  it('should list available skills', async () => {
    const skills = await manager.listAvailableSkills();
    expect(skills).toHaveLength(2);
    expect(skills[0].id).toBe('web-search');
  });

  it('should check tenant eligibility based on tier', async () => {
    // web-search is premium
    const isEligible = await manager.isTenantEligible('tenant-123', 'web-search', 'starter');
    expect(isEligible).toBe(false);

    const isEligiblePremium = await manager.isTenantEligible('tenant-123', 'web-search', 'pro');
    expect(isEligiblePremium).toBe(true);
  });
});
