import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SkillsManager } from './skillsManager.js';

// Mock openclaw skills
vi.mock('../../../openclaw/src/agents/skills/workspace.js', () => ({
  loadWorkspaceSkillEntries: vi.fn().mockResolvedValue([
    { id: 'web-search', metadata: { title: 'Web Search' } },
    { id: 'math', metadata: { title: 'Mathematics' } }
  ])
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
