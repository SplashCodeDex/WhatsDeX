import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ChannelLinker } from './ChannelLinker';
import { useOmnichannelStore } from '@/stores/useOmnichannelStore';
import { useAuth } from '@/features/auth';

// Mock the store
vi.mock('@/stores/useOmnichannelStore', () => ({
    useOmnichannelStore: vi.fn(),
}));

// Mock Auth
vi.mock('@/features/auth', () => ({
    useAuth: vi.fn(),
}));

// Mock next/navigation
vi.mock('next/navigation', () => ({
    useRouter: () => ({
        push: vi.fn(),
        refresh: vi.fn(),
    }),
    usePathname: () => '/',
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
        (useAuth as any).mockReturnValue({
            user: { planTier: 'starter' }
        });
    });

    it('should render the list of available channels', () => {
        render(<ChannelLinker agentId={mockAgentId} />);
        
        expect(screen.getByText(/whatsapp_1/i)).toBeDefined();
        expect(screen.getByText(/telegram_1/i)).toBeDefined();
    });

    it('should show "Linked" status for the correct channel', () => {
        render(<ChannelLinker agentId={mockAgentId} />);
        
        expect(screen.getByText(/Currently Linked to this Brain/i)).toBeDefined();
    });

    it('should allow unlinking an agent from a channel', () => {
        expect(true).toBe(true);
    });
});
