import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TelegramAdapter } from './TelegramAdapter.js';

const mockBot = {
  init: vi.fn().mockResolvedValue(undefined),
  on: vi.fn(),
  start: vi.fn().mockResolvedValue(undefined),
  stop: vi.fn().mockResolvedValue(undefined),
  botInfo: { username: 'test_bot' },
  api: { sendMessage: vi.fn() }
};

vi.mock('grammy', () => ({
  Bot: class {
    constructor() { return mockBot; }
  }
}));

vi.mock('../../../../../openclaw/src/telegram/send.js', () => ({
  sendMessageTelegram: vi.fn().mockResolvedValue({ message_id: 1 })
}));

describe('TelegramAdapter', () => {
  let adapter: TelegramAdapter;
  const tenantId = 'tenant-123';
  const botId = 'bot-tg';
  const token = '123456:ABC-DEF';

  beforeEach(async () => {
    vi.clearAllMocks();
    adapter = new TelegramAdapter(tenantId, botId, token);
  });

  it('should have id "telegram"', () => {
    expect(adapter.id).toBe('telegram');
  });

  it('should have instanceId equal to botId', () => {
    expect(adapter.instanceId).toBe(botId);
  });

  it('should initialize and connect', async () => {
    await adapter.connect();
    expect(mockBot.init).toHaveBeenCalled();
    expect(mockBot.start).toHaveBeenCalled();
  });

  it('should send a message', async () => {
    const { sendMessageTelegram } = await import('../../../../../openclaw/src/telegram/send.js');
    await adapter.connect();
    await adapter.sendMessage('chat123', 'hello');
    expect(sendMessageTelegram).toHaveBeenCalledWith('chat123', 'hello', expect.objectContaining({
      token,
      textMode: 'markdown'
    }));
  });

  it('should send a common message', async () => {
    const { sendMessageTelegram } = await import('../../../../../openclaw/src/telegram/send.js');
    await adapter.connect();
    await adapter.sendCommon({
      id: 'msg-1',
      platform: 'telegram',
      from: 'bot',
      to: 'chat123',
      content: { text: 'Common message text' },
      timestamp: Date.now()
    });
    expect(sendMessageTelegram).toHaveBeenCalledWith('chat123', 'Common message text', expect.objectContaining({
      token,
      textMode: 'markdown'
    }));
  });

  it('should trigger onMessage handler when telegram message arrives', async () => {
    const handler = vi.fn();
    adapter.onMessage(handler);
    
    await adapter.connect();
    
    const registeredHandler = mockBot.on.mock.calls.find(call => call[0] === 'message')?.[1];
    expect(registeredHandler).toBeDefined();

    const mockCtx = {
      from: { username: 'user1', id: 123 },
      message: { text: 'hi bot', date: 1676582400 }
    };

    await registeredHandler(mockCtx);

    expect(handler).toHaveBeenCalledWith(expect.objectContaining({
      tenantId,
      botId,
      channelId: 'telegram',
      sender: 'user1',
      content: 'hi bot'
    }));
  });
});
