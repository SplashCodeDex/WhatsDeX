import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { BotSettingsDialog } from './BotSettingsDialog';

// Mock Hooks and Actions
vi.mock('../actions', () => ({
    updateBot: vi.fn(),
}));

import { updateBot } from '../actions';

// Mock UI components to simplify
vi.mock('@/components/ui/dialog', () => ({
    Dialog: ({ children }: any) => <div>{children}</div>,
    DialogContent: ({ children }: any) => <div>{children}</div>,
    DialogHeader: ({ children }: any) => <div>{children}</div>,
    DialogTitle: ({ children }: any) => <div>{children}</div>,
    DialogDescription: ({ children }: any) => <div>{children}</div>,
    DialogFooter: ({ children }: any) => <div>{children}</div>,
}));

vi.mock('@/components/ui/tabs', () => ({
    Tabs: ({ children }: any) => <div>{children}</div>,
    TabsList: ({ children }: any) => <div>{children}</div>,
    TabsTrigger: ({ children }: any) => <button>{children}</button>,
    TabsContent: ({ children }: any) => <div>{children}</div>,
}));

describe('BotSettingsDialog', () => {
    it('should call updateBot server action when saving', async () => {
        const updateBotMock = updateBot as any;
        updateBotMock.mockResolvedValue({ success: true, data: {} });

        render(
            <BotSettingsDialog
                botId="bot-123"
                botType="whatsapp"
                initialConfig={{ name: 'Test Bot' }}
                open={true}
                onOpenChange={() => { }}
            />
        );

        // Change something (e.g. prefixes input)
        const prefixInput = screen.getByLabelText(/Prefixes/i);
        fireEvent.change(prefixInput, { target: { value: '.,!' } });

        // Submit the form.
        const form = screen.getByRole('form');
        fireEvent.submit(form);

        await waitFor(() => {
            expect(updateBotMock).toHaveBeenCalled();
        }, { timeout: 3000 });
    });
});
