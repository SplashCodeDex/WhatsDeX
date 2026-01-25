import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { CreateBotDialog } from './CreateBotDialog';

// Mock Hooks and Actions
vi.mock('@/features/bots', async (importOriginal) => {
    const actual = await importOriginal<any>();
    return {
        ...actual,
        useBots: () => ({ data: [] }),
        createBot: vi.fn(),
    };
});

import { createBot } from '@/features/bots';

vi.mock('@/features/billing', () => ({
  useSubscription: () => ({
    limits: { maxBots: 5 },
    isAtLimit: (count: number) => false,
    isLoading: false,
  }),
}));

// Mock UI
vi.mock('@/components/ui/dialog', () => ({
    Dialog: ({ children }: any) => <div>{children}</div>,
    DialogContent: ({ children }: any) => <div>{children}</div>,
    DialogHeader: ({ children }: any) => <div>{children}</div>,
    DialogTitle: ({ children }: any) => <div>{children}</div>,
    DialogDescription: ({ children }: any) => <div>{children}</div>,
    DialogFooter: ({ children }: any) => <div>{children}</div>,
    DialogTrigger: ({ children }: any) => <div>{children}</div>,
}));

// Mock Button specifically to ensure it's clickable
vi.mock('@/components/ui/button', () => ({
    Button: ({ children, onClick, ...props }: any) => (
        <button onClick={onClick} {...props}>{children}</button>
    ),
}));

describe('CreateBotDialog', () => {
    it('should use createBot server action on submit', async () => {
        const createBotMock = createBot as any;
        createBotMock.mockResolvedValue({ success: true, data: { id: '123' } });

        render(<CreateBotDialog />);

        // Open Dialog (Click Trigger)
        const buttons = screen.getAllByRole('button', { name: /create bot/i });
        const trigger = buttons.find(b => b.getAttribute('type') !== 'submit') || buttons[0];
        fireEvent.click(trigger);

        // Fill Name
        const nameInput = screen.getByLabelText(/Bot Name/i);
        fireEvent.change(nameInput, { target: { value: 'New Bot' } });

        // Submit
        const submitBtn = buttons.find(b => b.getAttribute('type') === 'submit') || buttons[1];
        fireEvent.click(submitBtn);

        // Verify Server Action call
        await waitFor(() => {
            expect(createBotMock).toHaveBeenCalled();
            const formData = createBotMock.mock.calls[0][1];
            expect(formData.get('name')).toBe('New Bot');
        });
    });
});