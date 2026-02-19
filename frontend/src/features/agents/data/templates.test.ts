import { describe, it, expect } from 'vitest';
import { AGENT_TEMPLATES } from './templates';
import { AgentTemplateSchema } from '../types';

describe('Agent Templates Data', () => {
    it('should have the three required templates', () => {
        expect(AGENT_TEMPLATES).toHaveLength(3);
        const ids = AGENT_TEMPLATES.map(t => t.id);
        expect(ids).toContain('template_sales');
        expect(ids).toContain('template_support');
        expect(ids).toContain('template_assistant');
    });

    it('should satisfy the AgentTemplateSchema for all templates', () => {
        AGENT_TEMPLATES.forEach(template => {
            const result = AgentTemplateSchema.safeParse(template);
            expect(result.success, `Template ${template.id} failed validation: ${result.error?.message}`).toBe(true);
        });
    });
});
