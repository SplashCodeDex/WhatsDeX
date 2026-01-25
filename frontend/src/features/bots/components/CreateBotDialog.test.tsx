import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
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

vi.mock('@/components/ui/button', () => ({
    Button: ({ children, onClick, type, ...props }: any) => (
        <button onClick={onClick} type={type} {...props}>{children}</button>
    ),
}));

describe('CreateBotDialog', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should use createBot server action on submit', async () => {
        const createBotMock = createBot as any;
        createBotMock.mockResolvedValue({ success: true, data: { id: '123' } });

        const { container } = render(<CreateBotDialog />);

        // Open Dialog
        const trigger = screen.getAllByRole('button', { name: /create bot/i })[0];
        fireEvent.click(trigger);

        // Fill Name
        const nameInput = screen.getByLabelText(/Bot Name/i);
        fireEvent.change(nameInput, { target: { value: 'New Bot' } });

        // Submit
        const submitBtn = container.querySelector('button[type="submit"]');
        if (submitBtn) fireEvent.click(submitBtn);

        // Verify Server Action call
        await waitFor(() => {
            expect(createBotMock).toHaveBeenCalled();
            const formData = createBotMock.mock.calls[0][1];
            expect(formData.get('name')).toBe('New Bot');
        });
    });

    it('should display inline validation error when creation fails', async () => {
        const createBotMock = createBot as any;
        createBotMock.mockResolvedValue({
            success: false,
            error: {
                code: 'validation_error',
                message: 'Invalid input',
                details: { name: ['Name is required'] }
            }
        });

        const { container } = render(<CreateBotDialog />);

        // Open Dialog
        const trigger = screen.getAllByRole('button', { name: /create bot/i })[0];
        fireEvent.click(trigger);

        // Fill Name to bypass browser validation if any, though we want server error
        const nameInput = screen.getByLabelText(/Bot Name/i);
        fireEvent.change(nameInput, { target: { value: 'Something' } });

        // Submit
        const submitBtn = container.querySelector('button[type="submit"]');
        if (submitBtn) fireEvent.click(submitBtn);

        expect(await screen.findByText('Name is required')).toBeDefined();
    });

    it('should display global error when server fails', async () => {
        const createBotMock = createBot as any;
        createBotMock.mockResolvedValue({
            success: false,
            error: {
                code: 'server_error',
                message: 'Something went wrong'
            }
        });

        const { container } = render(<CreateBotDialog />);

        // Open Dialog
        const trigger = screen.getAllByRole('button', { name: /create bot/i })[0];
        fireEvent.click(trigger);

        // Fill Name
        const nameInput = screen.getByLabelText(/Bot Name/i);
        fireEvent.change(nameInput, { target: { value: 'New Bot' } });

        // Submit
        const submitBtn = container.querySelector('button[type="submit"]');
        if (submitBtn) fireEvent.click(submitBtn);

        expect(await screen.findByText('Something went wrong')).toBeDefined();
    });
});
