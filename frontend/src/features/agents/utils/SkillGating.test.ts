import { describe, it, expect } from 'vitest';
import { isSkillAllowed } from './SkillGating';

describe('SkillGating Logic', () => {
    it('should allow basic skills for all tiers', () => {
        expect(isSkillAllowed('starter', 'basic_reply')).toBe(true);
        expect(isSkillAllowed('pro', 'basic_reply')).toBe(true);
    });

    it('should restrict Web Search to Pro and Enterprise', () => {
        expect(isSkillAllowed('starter', 'web_search')).toBe(false);
        expect(isSkillAllowed('pro', 'web_search')).toBe(true);
        expect(isSkillAllowed('enterprise', 'web_search')).toBe(true);
    });

    it('should restrict File Analysis to Pro and Enterprise', () => {
        expect(isSkillAllowed('starter', 'file_analysis')).toBe(false);
        expect(isSkillAllowed('pro', 'file_analysis')).toBe(true);
    });

    it('should restrict Custom Scripting to Enterprise only', () => {
        expect(isSkillAllowed('starter', 'custom_scripting')).toBe(false);
        expect(isSkillAllowed('pro', 'custom_scripting')).toBe(false);
        expect(isSkillAllowed('enterprise', 'custom_scripting')).toBe(true);
    });
});
