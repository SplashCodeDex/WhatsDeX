import { describe, it, expect, beforeEach, vi } from 'vitest';
import { IngressService } from './IngressService.js';
import { channelBindingService } from './ChannelBindingService.js';
import { webhookService } from './webhookService.js';
import { tenantConfigService } from './tenantConfigService.js';

// Mock dependencies
vi.mock('./ChannelBindingService.js', () => ({
  channelBindingService: {
    getActiveAgentForChannel: vi.fn()
  }
}));

vi.mock('./webhookService.js', () => ({
  webhookService: {
    dispatch: vi.fn()
  }
}));

vi.mock('./tenantConfigService.js', () => ({
  tenantConfigService: {
    isFeatureEnabled: vi.fn().mockResolvedValue(true)
  }
}));

vi.mock('../utils/createBotContext.js', () => ({
  createBotContext: vi.fn().mockResolvedValue({
    sender: { jid: 'user-123' },
    message: { conversation: 'hello' }
  })
}));

describe('IngressService', () => {
  let service: IngressService;
  const tenantId = 'tenant-123';
  const channelId = 'chan-456';
  const mockContext: any = {
    unifiedAI: {
      processMessage: vi.fn().mockResolvedValue({ success: true })
    }
  };

  beforeEach(() => {
    vi.clearAllMocks();
    service = IngressService.getInstance();
  });

  it('should route to AI Agent when agent is assigned', async () => {
    vi.mocked(channelBindingService.getActiveAgentForChannel).mockResolvedValue({
      success: true,
      data: { id: 'agent-1', name: 'AI Assistant', memorySearch: true, boundChannels: [], skills: [], createdAt: new Date(), updatedAt: new Date() }
    });

    await service.handleMessage(tenantId, channelId, {} as any, mockContext);

    expect(mockContext.unifiedAI.processMessage).toHaveBeenCalled();
    expect(webhookService.dispatch).not.toHaveBeenCalledWith(tenantId, 'message.received', expect.anything());
  });

  it('should forward to Webhook when no agent is assigned', async () => {
    vi.mocked(channelBindingService.getActiveAgentForChannel).mockResolvedValue({
      success: true,
      data: null
    });

    await service.handleMessage(tenantId, channelId, {} as any, mockContext);

    expect(mockContext.unifiedAI.processMessage).not.toHaveBeenCalled();
    expect(webhookService.dispatch).toHaveBeenCalledWith(tenantId, 'message.received', expect.objectContaining({
      channelId,
      sender: 'user-123',
      message: 'hello'
    }));
  });
});
