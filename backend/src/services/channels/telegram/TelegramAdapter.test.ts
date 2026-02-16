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

vi.mock('../../../../openclaw/src/telegram/send.js', () => ({
  sendMessageTelegram: vi.fn().mockResolvedValue({ message_id: 1 })
}));

describe('TelegramAdapter', () => {
  let adapter: TelegramAdapter;
  const tenantId = 'tenant-123';
  const botId = 'bot-tg';
  const token = '123456:ABC-DEF';

  beforeEach(() => {
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
