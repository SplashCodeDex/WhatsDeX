import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MultiTenantBotService } from './multiTenantBotService.js';
import { WhatsappAdapter } from '../services/channels/whatsapp/WhatsappAdapter.js';
import { channelManager } from '../services/channels/ChannelManager.js';

const { mockUnifiedAI, mockContext } = vi.hoisted(() => {
  const aiMock = { processMessage: vi.fn().mockResolvedValue({ success: true }) };
  return {
    mockUnifiedAI: aiMock,
    mockContext: {
      commandSystem: { processMessage: vi.fn().mockResolvedValue(false) },
      unifiedAI: aiMock
    }
  };
});

// Mock dependencies with correct relative paths
vi.mock('../services/analytics.js', () => ({
  default: {
    trackMessage: vi.fn().mockResolvedValue(undefined)
  }
}));

vi.mock('../services/socketService.js', () => ({
  socketService: {
    emitToTenant: vi.fn(),
    emitBotProgress: vi.fn(),
    emitActivity: vi.fn(),
    emitBotStatus: vi.fn()
  }
}));

vi.mock('../services/eventHandler.js', () => ({
  eventHandler: {
    bind: vi.fn()
  }
}));

vi.mock('../services/memoryService.js', () => ({
  memoryService: {}
}));

vi.mock('../services/embeddingService.js', () => ({
  embeddingService: {
    getInstance: vi.fn()
  },
  getEmbeddingService: vi.fn()
}));

vi.mock('@/lib/apiKeyManager.js', () => ({
  ApiKeyManager: {
    getInstance: vi.fn().mockReturnValue({
      getKey: vi.fn().mockReturnValue({ success: true, data: 'test-key' })
    })
  }
}));

// Mock adapter and manager
const mockAdapterInstance: any = {
  id: 'whatsapp',
  instanceId: 'bot-123',
  onMessage: vi.fn(),
  connect: vi.fn().mockResolvedValue(undefined),
  socket: { ev: { on: vi.fn() } }
};

vi.mock('../services/channels/whatsapp/WhatsappAdapter.js', () => {
  return {
    WhatsappAdapter: vi.fn().mockImplementation(function() {
      return mockAdapterInstance;
    })
  };
});

vi.mock('../services/channels/ChannelManager.js', () => {
  return {
    channelManager: {
      registerAdapter: vi.fn(),
      getAdapter: vi.fn()
    }
  };
});

vi.mock('@/services/FirebaseService.js', () => ({
  firebaseService: {
    getDoc: vi.fn().mockImplementation((path, id) => {
      if (id === 'bot-123') return Promise.resolve({ id: 'bot-123', type: 'whatsapp', status: 'disconnected', config: {} });
      return Promise.resolve(null);
    }),
    setDoc: vi.fn().mockResolvedValue(undefined),
    getCollection: vi.fn().mockResolvedValue([])
  }
}));

vi.mock('../services/tenantConfigService.js', () => ({
  tenantConfigService: {
    getBotConfig: vi.fn().mockResolvedValue({ success: true, data: {} }),
    isFeatureEnabled: vi.fn().mockResolvedValue(true)
  }
}));

vi.mock('../services/flowService.js', () => ({
  flowService: {
    listActiveFlows: vi.fn().mockResolvedValue({ success: true, data: [] })
  }
}));

vi.mock('@/lib/context.js', () => ({
  default: vi.fn().mockResolvedValue(mockContext)
}));

vi.mock('../utils/createBotContext.js', () => ({
  createBotContext: vi.fn().mockResolvedValue({
    sender: { jid: '12345@s.whatsapp.net' },
    message: { conversation: 'hello' }
  })
}));

describe('MultiTenantBotService', () => {
  let service: MultiTenantBotService;

  beforeEach(() => {
    vi.clearAllMocks();
    // @ts-ignore - Accessing private instance for testing
    MultiTenantBotService.instance = undefined;
    service = MultiTenantBotService.getInstance();
    service.setContext(mockContext as any);
  });

  it('should start a whatsapp bot using WhatsappAdapter', async () => {
    const tenantId = 'tenant-123';
    const botId = 'bot-123';

    const result = await service.startBot(tenantId, botId);

    expect(result.success).toBe(true);
    expect(channelManager.registerAdapter).toHaveBeenCalledWith(mockAdapterInstance);
  });

  it('should route adapter message to Gemini AI', async () => {
    const tenantId = 'tenant-123';
    const botId = 'bot-123';

    await service.startBot(tenantId, botId);

    // Get the handler registered with the adapter
    const handler = mockAdapterInstance.onMessage.mock.calls[0][0];
    expect(handler).toBeDefined();

    // Simulate adapter message
    const mockEvent = {
      tenantId,
      botId,
      channelId: 'whatsapp',
      sender: '12345@s.whatsapp.net',
      content: { conversation: 'hello' },
      timestamp: new Date(),
      raw: { key: { remoteJid: '12345' }, message: { conversation: 'hello' } }
    };

    await handler(mockEvent);

    // Verify AI processing was triggered
    expect(mockUnifiedAI.processMessage).toHaveBeenCalled();
  });
});
