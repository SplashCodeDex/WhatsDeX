import { describe, it, expect, beforeEach, vi } from 'vitest';
import { DiscordAdapter } from './DiscordAdapter.js';

// Mock discord.js
const mockClient = {
  login: vi.fn().mockResolvedValue('token'),
  on: vi.fn(),
  user: { tag: 'test_bot#1234' }
};

const mockEmbed = {
  setDescription: vi.fn().mockReturnThis(),
  setTimestamp: vi.fn().mockReturnThis(),
  setImage: vi.fn().mockReturnThis(),
  data: {}
};

vi.mock('discord.js', () => ({
  Client: class {
    constructor() { return mockClient; }
  },
  GatewayIntentBits: {
    Guilds: 1,
    GuildMessages: 2,
    MessageContent: 3
  },
  EmbedBuilder: class {
    constructor() { return mockEmbed; }
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

  it('should send a common message as an embed', async () => {
    const mockSend = vi.fn().mockResolvedValue({ id: 'msg-1' });
    mockClient.channels = {
      fetch: vi.fn().mockResolvedValue({ send: mockSend })
    };

    await adapter.connect();
    await adapter.sendCommon({
      id: 'msg-1',
      platform: 'discord',
      from: 'bot',
      to: 'channel-123',
      content: { text: 'Common message text' },
      timestamp: Date.now()
    });

    expect(mockEmbed.setDescription).toHaveBeenCalledWith('Common message text');
    expect(mockSend).toHaveBeenCalledWith(expect.objectContaining({
      embeds: expect.arrayContaining([mockEmbed])
    }));
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
