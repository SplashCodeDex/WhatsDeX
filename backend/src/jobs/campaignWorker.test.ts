import { describe, it, expect, beforeEach, vi } from 'vitest';
import { campaignWorker } from './campaignWorker.js';
import { firebaseService } from '../services/FirebaseService.js';
import { multiTenantBotService } from '../services/multiTenantBotService.js';
import { TemplateService } from '../services/templateService.js';

// Hoist mocks
const { mockFirebase, mockBotService, mockTemplateService } = vi.hoisted(() => ({
  mockFirebase: {
    getDoc: vi.fn(),
    getCollection: vi.fn(),
    setDoc: vi.fn(),
  },
  mockBotService: {
    sendMessage: vi.fn(),
  },
  mockTemplateService: {
    getTemplate: vi.fn(),
  }
}));

// Mock dependencies
vi.mock('../services/FirebaseService.js', () => ({
  firebaseService: mockFirebase,
  FirebaseService: { getInstance: () => mockFirebase }
}));

vi.mock('../services/multiTenantBotService.js', () => ({
  multiTenantBotService: mockBotService
}));

vi.mock('../services/templateService.js', () => ({
  TemplateService: { getInstance: () => mockTemplateService }
}));

vi.mock('../services/webhookService.js', () => ({
  webhookService: { dispatch: vi.fn().mockResolvedValue(undefined) }
}));

vi.mock('../services/campaignSocketService.js', () => ({
  campaignSocketService: { emitProgress: vi.fn() }
}));

// Mock BullMQ Worker
vi.mock('bullmq', () => ({
  Worker: vi.fn().mockImplementation(function() {
    return { on: vi.fn() };
  })
}));

describe('CampaignWorker pooling', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should load-balance across multiple bots if distribution is pool', async () => {
    const tenantId = 'tenant_1';
    const campaign = {
      id: 'camp_1',
      templateId: 'tpl_1',
      audience: { type: 'audience', targetId: 'aud_1' },
      distribution: { type: 'pool' },
      antiBan: { minDelay: 0, maxDelay: 0, aiSpinning: false },
      stats: { sent: 0, failed: 0 }
    };

    // Mock 2 Bots
    const mockBots = [
      { id: 'bot_1', status: 'connected' },
      { id: 'bot_2', status: 'connected' }
    ];

    // Mock 2 Contacts
    const mockContacts = [
      { phone: '111', name: 'User 1', tags: [] },
      { phone: '222', name: 'User 2', tags: [] }
    ];

    mockFirebase.getDoc.mockResolvedValueOnce(campaign); // Initial fetch
    mockFirebase.getDoc.mockResolvedValueOnce({ ...campaign, status: 'sending' }); // Status check in loop 1
    mockFirebase.getDoc.mockResolvedValueOnce({ ...campaign, status: 'sending' }); // Status check in loop 2
    mockFirebase.getDoc.mockResolvedValueOnce({ id: 'aud_1', filters: {} }); // Audience fetch
    
    mockFirebase.getCollection.mockImplementation(async (col) => {
        if (col === 'bots') return mockBots;
        if (col === 'contacts') return mockContacts;
        return [];
    });

    mockTemplateService.getTemplate.mockResolvedValue({ success: true, data: { content: 'Hello {{name}}' } });
    mockBotService.sendMessage.mockResolvedValue({ success: true });

    // Use protected method via cast for testing
    const worker = campaignWorker as any;
    await worker.processCampaign({ data: { tenantId, campaign } });

    expect(mockBotService.sendMessage).toHaveBeenCalledTimes(2);
    // Verify round-robin (approximate check)
    const call1 = mockBotService.sendMessage.mock.calls[0];
    const call2 = mockBotService.sendMessage.mock.calls[1];
    
    expect(call1[1]).toBe('bot_1');
    expect(call2[1]).toBe('bot_2');
  });
});