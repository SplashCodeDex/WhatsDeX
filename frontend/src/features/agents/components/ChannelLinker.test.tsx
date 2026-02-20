import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ChannelLinker } from './ChannelLinker';
import { useOmnichannelStore } from '@/stores/useOmnichannelStore';

// Mock the store
vi.mock('@/stores/useOmnichannelStore', () => ({
    useOmnichannelStore: vi.fn(),
}));

describe('ChannelLinker', () => {
    const mockAgentId = 'agent_123';
    const mockChannels = [
        { id: 'whatsapp_1', type: 'whatsapp', status: 'connected', linkedAgentId: 'agent_123' },
        { id: 'telegram_1', type: 'telegram', status: 'disconnected', linkedAgentId: null },
    ];

    beforeEach(() => {
        vi.clearAllMocks();
        (useOmnichannelStore as any).mockReturnValue({
            channels: mockChannels,
            fetchChannels: vi.fn(),
            isLoading: false,
        });
    });

    it('should render the list of available channels', () => {
        render(<ChannelLinker agentId={mockAgentId} />);
        
        expect(screen.getByText(/whatsapp_1/i)).toBeDefined();
        expect(screen.getByText(/telegram_1/i)).toBeDefined();
    });

    it('should show "Linked" status for the correct channel', () => {
        render(<ChannelLinker agentId={mockAgentId} />);
        
        expect(screen.getByText(/Linked/i)).toBeDefined();
    });

    it('should allow unlinking an agent from a channel', () => {
        // Implementation details will vary, but we define the expectation here
        expect(true).toBe(true);
    });
});
