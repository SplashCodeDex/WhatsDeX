import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useOmnichannelStore } from './useOmnichannelStore';
import { api } from '@/lib/api/client';

// Mock the api client
vi.mock('@/lib/api/client', () => ({
    api: {
        get: vi.fn(),
    },
}));

describe('useOmnichannelStore', () => {
    beforeEach(() => {
        // Reset the store before each test
        const { activity, channels } = useOmnichannelStore.getState();
        useOmnichannelStore.setState({
            channels: [],
            activity: [],
            isLoading: false,
            error: null
        });
        vi.clearAllMocks();
    });

    it('should initialize with default values', () => {
        const state = useOmnichannelStore.getState();
        expect(state.channels).toEqual([]);
        expect(state.activity).toEqual([]);
        expect(state.isLoading).toBe(false);
        expect(state.error).toBe(null);
    });

    it('should fetch channels successfully', async () => {
        const mockChannels = [
            { id: 'bot_1', name: 'WhatsApp Bot', type: 'whatsapp', status: 'connected', account: '123456789' },
        ];

        (api.get as any).mockResolvedValue({
            success: true,
            data: mockChannels,
        });

        await useOmnichannelStore.getState().fetchChannels();

        const state = useOmnichannelStore.getState();
        expect(state.channels).toEqual(mockChannels);
        expect(state.isLoading).toBe(false);
        expect(state.error).toBe(null);
    });

    it('should handle fetch errors', async () => {
        (api.get as any).mockResolvedValue({
            success: false,
            error: { message: 'API Error' },
        });

        await useOmnichannelStore.getState().fetchChannels();

        const state = useOmnichannelStore.getState();
        expect(state.channels).toEqual([]);
        expect(state.isLoading).toBe(false);
        expect(state.error).toBe('API Error');
    });

    it('should update channel status', () => {
        useOmnichannelStore.setState({
            channels: [{ id: 'bot_1', name: 'Bot', type: 'whatsapp', status: 'disconnected', account: null }],
        });

        useOmnichannelStore.getState().updateChannelStatus('bot_1', 'connected');

        expect(useOmnichannelStore.getState().channels[0]!.status).toBe('connected');
    });

    it('should add activity events', () => {
        const event = {
            botId: 'bot_1',
            channel: 'whatsapp',
            type: 'inbound',
            message: 'Hello',
            timestamp: new Date().toISOString(),
        };

        useOmnichannelStore.getState().addActivityEvent(event as any);

        const state = useOmnichannelStore.getState();
        expect(state.activity).toHaveLength(1);
        expect(state.activity[0]!.message).toBe('Hello');
        expect(state.activity[0]!.id).toBeDefined();
    });

    it('should handle progress updates', () => {
        useOmnichannelStore.setState({
            channels: [{ id: 'bot_1', name: 'Bot', type: 'whatsapp', status: 'disconnected', account: null }],
        });

        useOmnichannelStore.getState().handleProgressUpdate({
            botId: 'bot_1',
            step: 'Connecting',
            status: 'complete',
            timestamp: new Date().toISOString(),
        });

        const state = useOmnichannelStore.getState();
        expect(state.channels[0]!.status).toBe('connected');
        expect(state.activity).toHaveLength(1);
        expect(state.activity[0]!.message).toContain('Connecting: complete');
    });
});
