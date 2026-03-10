import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { WhatsappAdapter } from './WhatsappAdapter.js';
import * as baileys from 'baileys';
import { useFirestoreAuthState } from '../../../lib/baileysFirestoreAuth.js';

// Mock dependencies
const mockClearAuthState = vi.fn().mockResolvedValue(undefined);
const mockSaveCreds = vi.fn();

vi.mock('../../../lib/baileysFirestoreAuth.js', () => ({
    useFirestoreAuthState: vi.fn(() => Promise.resolve({
        state: { creds: { registrationId: 123 }, keys: {} },
        saveCreds: mockSaveCreds,
        clearAuthState: mockClearAuthState
    }))
}));

// We'll use a more controllable mock for makeWASocket
const mockSocketOn = vi.fn();
const mockSocketEmit = vi.fn();
const mockSocketSendMessage = vi.fn().mockResolvedValue({ key: { id: 'msg_id' } });

vi.mock('baileys', async () => {
    const actual = await vi.importActual('baileys');
    return {
        ...actual,
        makeWASocket: vi.fn(() => ({
            ev: { 
                on: mockSocketOn, 
                emit: mockSocketEmit 
            },
            requestPairingCode: vi.fn(),
            end: vi.fn(),
            sendPresenceUpdate: vi.fn(),
            sendMessage: mockSocketSendMessage
        })),
        fetchLatestBaileysVersion: vi.fn(() => Promise.resolve({ version: [2, 3000, 1015901307] })),
        DisconnectReason: { loggedOut: 401 },
        Browsers: { macOS: vi.fn() }
    };
});

vi.mock('@/services/jobQueue.js', () => ({
    jobQueueService: { addJob: vi.fn() }
}));

describe('WhatsApp Resilience Wave 1 (Manual Mocks)', () => {
    const tenantId = 'resilience-tenant';
    const channelId = 'resilience-channel';
    let adapter: WhatsappAdapter;

    beforeEach(async () => {
        vi.clearAllMocks();
        adapter = new WhatsappAdapter(tenantId, channelId);
    });

    it('Scenario 3: should handle 401 Unauthorized via AuthSystem event', async () => {
        // Capture the connection.update callback
        let connUpdateCallback: any;
        mockSocketOn.mockImplementation((event, cb) => {
            if (event === 'connection.update') connUpdateCallback = cb;
        });

        await adapter.connect();
        
        // Simulate 'open' first to establish state
        connUpdateCallback({ connection: 'open' });
        expect(adapter.status).toBe('connected');

        // Simulate 401
        await connUpdateCallback({ 
            connection: 'close', 
            lastDisconnect: { error: { output: { statusCode: 401 } } } 
        });

        // Verify cleanup
        expect(mockClearAuthState).toHaveBeenCalled();
        expect(adapter.status).toBe('logged_out');
    });

    it('Scenario 16: should handle message bursts without dropping state', async () => {
        let messageCallback: any;
        mockSocketOn.mockImplementation((event, cb) => {
            if (event === 'messages.upsert') messageCallback = cb;
        });

        const handler = vi.fn();
        adapter.onMessage(handler);
        await adapter.connect();

        // Simulate burst of 10 messages
        const burstSize = 10;
        const messages = Array.from({ length: burstSize }).map((_, i) => ({
            key: { remoteJid: 'user@s.whatsapp.net', fromMe: false, id: `id_${i}` },
            message: { conversation: `Message ${i}` },
            messageTimestamp: Math.floor(Date.now() / 1000)
        }));

        await messageCallback({
            type: 'notify',
            messages
        });

        expect(handler).toHaveBeenCalledTimes(burstSize);
    });
});
