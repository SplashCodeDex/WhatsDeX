import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ActivityFeed } from './ActivityFeed';
import { useOmnichannelStore } from '@/stores/useOmnichannelStore';

// Mock the store
vi.mock('@/stores/useOmnichannelStore', () => ({
    useOmnichannelStore: vi.fn(),
}));

describe('ActivityFeed', () => {
    const mockActivity = [
        { id: '1', channel: 'whatsapp', type: 'inbound', message: 'Hi', timestamp: new Date().toISOString() },
        { id: '2', channel: 'whatsapp', type: 'agent_thinking', message: 'Agent is thinking...', timestamp: new Date().toISOString() },
        { id: '3', channel: 'telegram', type: 'tool_start', message: 'Using tool: web_search', timestamp: new Date().toISOString() },
    ];

    beforeEach(() => {
        vi.clearAllMocks();
        (useOmnichannelStore as any).mockReturnValue({
            activity: mockActivity,
        });
    });

    it('should render various activity types with correct labels', () => {
        render(<ActivityFeed />);
        
        expect(screen.getByText(/Agent is thinking/i)).toBeDefined();
        expect(screen.getByText(/Using tool: web_search/i)).toBeDefined();
        
        // Check for the badges
        expect(screen.getByText(/agent thinking/i)).toBeDefined();
        expect(screen.getByText(/tool start/i)).toBeDefined();
    });
});
