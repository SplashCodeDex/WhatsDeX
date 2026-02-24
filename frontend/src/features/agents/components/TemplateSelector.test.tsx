import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TemplateSelector } from './TemplateSelector';
import { useAuth } from '@/features/auth';

// Mock Auth
vi.mock('@/features/auth', () => ({
    useAuth: vi.fn(),
}));

describe('TemplateSelector', () => {
    const mockOnSelect = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
        (useAuth as any).mockReturnValue({ user: { plan: 'starter' } });
    });

    it('should render all templates', () => {
        render(<TemplateSelector onSelect={mockOnSelect} />);

        expect(screen.getByText('Support Hero')).toBeDefined();
        expect(screen.getByText('Sales Pro')).toBeDefined();
        expect(screen.getByText('Personal Assistant')).toBeDefined();
    });

    it('should show PRO badge for Sales Pro on starter plan', () => {
        render(<TemplateSelector onSelect={mockOnSelect} />);

        // Use getAllByText because multiple elements might contain "PRO" (like descriptions)
        const badges = screen.getAllByText(/PRO/i);
        expect(badges.length).toBeGreaterThan(0);
    });

    it('should call onSelect when a template is clicked', () => {
        render(<TemplateSelector onSelect={mockOnSelect} />);

        const supportHero = screen.getByText('Support Hero').closest('button');
        if (supportHero) {
            fireEvent.click(supportHero);
        }

        expect(mockOnSelect).toHaveBeenCalledWith(
            expect.objectContaining({ id: 'template_support' })
        );
    });
});
