import { describe, it, expect, beforeEach, vi } from 'vitest';
import { WhatsappAdapter } from './WhatsappAdapter.js';

// Mock dependencies
const mockSocket = {
  ev: { 
    on: vi.fn(),
    emit: vi.fn()
  },
  sendMessage: vi.fn().mockResolvedValue({ key: { id: 'msg-123' } })
};

const mockAuthSystemInstance = {
  on: vi.fn(),
  connect: vi.fn().mockResolvedValue({ 
    success: true, 
    data: mockSocket
  }),
  disconnect: vi.fn().mockResolvedValue({ success: true })
};

vi.mock('@/services/authSystem.js', () => {
  return {
    default: class {
      constructor() {
        return mockAuthSystemInstance;
      }
    }
  };
});

describe('WhatsappAdapter', () => {
  let adapter: WhatsappAdapter;
  const tenantId = 'tenant-abc';
  const botId = 'bot-123';

  beforeEach(() => {
    vi.clearAllMocks();
    adapter = new WhatsappAdapter(tenantId, botId);
  });

  it('should have id "whatsapp"', () => {
    expect(adapter.id).toBe('whatsapp');
  });

  it('should have instanceId equal to botId', () => {
    expect(adapter.instanceId).toBe(botId);
  });

  it('should connect', async () => {
    await adapter.connect();
    expect(mockAuthSystemInstance.connect).toHaveBeenCalled();
  });

  it('should send a message', async () => {
    await adapter.connect();
    await adapter.sendMessage('+123456789', 'hello');
    expect(mockSocket.sendMessage).toHaveBeenCalledWith(
      expect.stringContaining('+123456789'), 
      expect.objectContaining({ text: 'hello' })
    );
  });

  it('should trigger onMessage handler when message arrives', async () => {
    const handler = vi.fn();
    adapter.onMessage(handler);
    
    await adapter.connect();
    
    const registeredHandler = mockSocket.ev.on.mock.calls.find(call => call[0] === 'messages.upsert')?.[1];
    expect(registeredHandler).toBeDefined();

    const mockMessage = {
      key: { remoteJid: '12345@s.whatsapp.net' },
      message: { conversation: 'hello bot' },
      messageTimestamp: 1676582400
    };

    await registeredHandler({ messages: [mockMessage], type: 'notify' });

    expect(handler).toHaveBeenCalledWith(expect.objectContaining({
      tenantId,
      botId,
      channelId: 'whatsapp',
      sender: '12345@s.whatsapp.net',
      content: mockMessage.message
    }));
  });
});
