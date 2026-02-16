import { describe, it, expect, beforeEach, vi } from 'vitest';
import { DiscordAdapter } from './DiscordAdapter.js';

// Mock discord.js
const mockClient = {
  login: vi.fn().mockResolvedValue('token'),
  on: vi.fn(),
  user: { tag: 'test_bot#1234' }
};

vi.mock('discord.js', () => ({
  Client: class {
    constructor() { return mockClient; }
  },
  GatewayIntentBits: {
    Guilds: 1,
    GuildMessages: 2,
    MessageContent: 3
  }
}));

describe('DiscordAdapter', () => {
  let adapter: DiscordAdapter;
  const tenantId = 'tenant-123';
  const botId = 'bot-discord';
  const token = 'MTA...';

  beforeEach(() => {
    vi.clearAllMocks();
    adapter = new DiscordAdapter(tenantId, botId, token);
  });

  it('should have id "discord"', () => {
    expect(adapter.id).toBe('discord');
  });

  it('should initialize and connect', async () => {
    await adapter.connect();
    expect(mockClient.login).toHaveBeenCalledWith(token);
  });

  it('should trigger onMessage handler', async () => {
    const handler = vi.fn();
    adapter.onMessage(handler);
    
    await adapter.connect();
    
    const registeredHandler = mockClient.on.mock.calls.find(call => call[0] === 'messageCreate')?.[1];
    expect(registeredHandler).toBeDefined();

    const mockMsg = {
      author: { username: 'discorduser', bot: false },
      content: 'hello discord',
      createdAt: new Date(),
      channel: { id: 'chan-1' }
    };

    await registeredHandler(mockMsg);

    expect(handler).toHaveBeenCalledWith(expect.objectContaining({
      tenantId,
      botId,
      channelId: 'discord',
      sender: 'discorduser'
    }));
  });
});
