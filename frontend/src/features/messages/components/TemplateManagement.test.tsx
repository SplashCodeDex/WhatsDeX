import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { TemplateManagement } from './TemplateManagement';
import { useTemplates, useSpinMessage } from '../hooks/useTemplates';
import { useAuth } from '@/features/auth';
import { toast } from 'sonner';

// Mock dependencies
vi.mock('../hooks/useTemplates', () => ({
    useTemplates: vi.fn(),
    useSpinMessage: vi.fn(),
}));

vi.mock('@/features/auth', () => ({
    useAuth: vi.fn(),
}));

vi.mock('sonner', () => ({
    toast: {
        success: vi.fn(),
        error: vi.fn(),
    },
}));

describe('TemplateManagement', () => {
    const mockTemplates = [
        {
            id: 't1',
            name: 'Welcome Template',
            content: 'Hello {{name}}, welcome to WhatsDeX!',
            category: 'marketing',
            mediaType: 'text',
            updatedAt: new Date().toISOString()
        },
        {
            id: 't2',
            name: 'Alert Template',
            content: 'Emergency alert: {{message}}',
            category: 'utility',
            mediaType: 'text',
            updatedAt: new Date().toISOString()
        },
    ];

    const mockSpinMessage = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
        // Mock clipboard
        Object.assign(navigator, {
            clipboard: {
                writeText: vi.fn().mockResolvedValue(undefined),
            },
        });
        (useTemplates as any).mockReturnValue({
            data: mockTemplates,
            isLoading: false,
            error: null,
        });
        (useSpinMessage as any).mockReturnValue({
            mutateAsync: mockSpinMessage,
            isPending: false,
        });
        (useAuth as any).mockReturnValue({
            user: { plan: 'enterprise' }
        });
    });

    it('should render all templates', () => {
        render(<TemplateManagement />);
        expect(screen.getByText('Welcome Template')).toBeDefined();
        expect(screen.getByText('Alert Template')).toBeDefined();
    });

    it('should filter templates based on search term', async () => {
        render(<TemplateManagement />);

        const searchInput = screen.getByPlaceholderText('Search templates...');
        fireEvent.change(searchInput, { target: { value: 'Welcome' } });

        expect(screen.getByText('Welcome Template')).toBeDefined();
        expect(screen.queryByText('Alert Template')).toBeNull();
    });

    it('should trigger AI spin when authorized', async () => {
        mockSpinMessage.mockResolvedValue('New spun content');
        render(<TemplateManagement />);

        // Find the spin button (Sparkles icon)
        // In the component, it's a button with size="icon" and a Sparkles icon
        // I'll add a testid or use a selector
        const spinButton = screen.getAllByLabelText('AI Spin')[0];

        await act(async () => {
            fireEvent.click(spinButton!);
        });

        expect(mockSpinMessage).toHaveBeenCalledWith(mockTemplates[0]!.content);
        expect(toast.success).toHaveBeenCalledWith(
            expect.stringContaining('AI variation generated'),
            expect.any(Object)
        );
    });

    it('should show error when trying to spin on non-enterprise plan', async () => {
        (useAuth as any).mockReturnValue({
            user: { plan: 'starter' }
        });

        render(<TemplateManagement />);

        const spinButton = screen.getAllByLabelText('AI Spin')[0];

        await act(async () => {
            fireEvent.click(spinButton!);
        });

        expect(mockSpinMessage).not.toHaveBeenCalled();
        expect(toast.error).toHaveBeenCalledWith(expect.stringContaining('Enterprise-only feature'));
    });
});
