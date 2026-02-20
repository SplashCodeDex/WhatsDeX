import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import { UnifiedInbox } from './UnifiedInbox';
import { useMessageHistory } from '../hooks/useMessageHistory';
import { api } from '@/lib/api/client';

// Mock dependencies
vi.mock('../hooks/useMessageHistory', () => ({
    useMessageHistory: vi.fn(),
}));

vi.mock('@/lib/api/client', () => ({
    api: {
        post: vi.fn(),
    },
}));

describe('UnifiedInbox', () => {
    const mockMessages = [
        { id: '1', channelType: 'whatsapp', content: 'WA message', timestamp: new Date().toISOString(), status: 'sent', remoteJid: 'user1', fromMe: false },
        { id: '2', channelType: 'telegram', content: 'TG message', timestamp: new Date().toISOString(), status: 'delivered', remoteJid: 'user2', fromMe: true },
    ];

    const mockRefetch = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
        (useMessageHistory as any).mockReturnValue({
            data: mockMessages,
            isLoading: false,
            error: null,
            refetch: mockRefetch,
        });
    });

    it('should render all messages by default', () => {
        render(<UnifiedInbox />);
        expect(screen.getByText('WA message')).toBeDefined();
        expect(screen.getByText('TG message')).toBeDefined();
    });

    it.skip('should filter messages when a channel is selected', async () => {
        render(<UnifiedInbox />);
        
        const waFilter = screen.getByTestId('filter-whatsapp');
        
        fireEvent.click(waFilter);
        
        await waitFor(() => {
            expect(screen.getByText('WA message')).toBeDefined();
            expect(screen.queryByText('TG message')).toBeNull();
        }, { timeout: 2000 });
    });

    it('should toggle reply input when clicking reply button', async () => {
        render(<UnifiedInbox />);
        
        const replyButton = screen.getByText('Reply');
        
        fireEvent.click(replyButton);
        expect(screen.getByPlaceholderText('Type your reply...')).toBeDefined();
        
        fireEvent.click(replyButton);
        expect(screen.queryByPlaceholderText('Type your reply...')).toBeNull();
    });

    it('should send a reply and refetch history', async () => {
        (api.post as any).mockResolvedValue({ success: true });
        
        render(<UnifiedInbox />);
        
        const replyButton = screen.getByText('Reply');
        fireEvent.click(replyButton);
        
        const input = screen.getByPlaceholderText('Type your reply...');
        fireEvent.change(input, { target: { value: 'Hello back' } });
        
        const sendButton = screen.getByLabelText('Send reply');
        
        await act(async () => {
            fireEvent.click(sendButton);
        });
        
        expect(api.post).toHaveBeenCalledWith('/api/messages/reply', {
            messageId: '1',
            text: 'Hello back'
        });
        expect(mockRefetch).toHaveBeenCalled();
        expect(screen.queryByPlaceholderText('Type your reply...')).toBeNull();
    });
});
