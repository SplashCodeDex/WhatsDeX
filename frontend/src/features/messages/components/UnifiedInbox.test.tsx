import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { UnifiedInbox } from './UnifiedInbox';
import { useMessageHistory } from '../hooks/useMessageHistory';

// Mock the hook
vi.mock('../hooks/useMessageHistory', () => ({
    useMessageHistory: vi.fn(),
}));

describe('UnifiedInbox', () => {
    const mockMessages = [
        { id: '1', channelType: 'whatsapp', content: 'WA message', timestamp: new Date().toISOString(), status: 'sent', remoteJid: 'user1' },
        { id: '2', channelType: 'telegram', content: 'TG message', timestamp: new Date().toISOString(), status: 'delivered', remoteJid: 'user2' },
    ];

    beforeEach(() => {
        vi.clearAllMocks();
        (useMessageHistory as any).mockReturnValue({
            data: mockMessages,
            isLoading: false,
            error: null,
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
        
        await act(async () => {
            fireEvent.click(waFilter);
        });
        
        expect(screen.getByText('WA message')).toBeDefined();
        expect(screen.queryByText('TG message')).toBeNull();
    });
});
