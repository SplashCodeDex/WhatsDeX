import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
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

describe('CampaignWorker throttling', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should apply delays between messages', async () => {
    const tenantId = 'tenant_1';
    const campaign = {
      id: 'camp_1',
      templateId: 'tpl_1',
      audience: { type: 'audience', targetId: 'aud_1' },
      distribution: { type: 'single', botId: 'bot_1' },
      antiBan: { minDelay: 1, maxDelay: 2, aiSpinning: false },
      stats: { sent: 0, failed: 0 }
    };

    const mockBots = [{ id: 'bot_1', status: 'connected' }];
    const mockContacts = [
      { phone: '111', name: 'U1' },
      { phone: '222', name: 'U2' }
    ];

    mockFirebase.getDoc.mockResolvedValue(campaign);
    mockFirebase.getCollection.mockImplementation(async (col) => {
        if (col === 'bots') return mockBots;
        if (col === 'contacts') return mockContacts;
        return [];
    });

    mockTemplateService.getTemplate.mockResolvedValue({ success: true, data: { content: 'Hi' } });
    mockBotService.sendMessage.mockResolvedValue({ success: true });

    const worker = campaignWorker as any;
    
    // Start processing
    const promise = worker.processCampaign({ data: { tenantId, campaign } });

    // Wait for first message and delay start
    await vi.advanceTimersByTimeAsync(0); 
    expect(mockBotService.sendMessage).toHaveBeenCalledTimes(1);

    // Advance past the first delay (1-2s)
    await vi.advanceTimersByTimeAsync(2000);
    
    // Should have sent the second message
    await promise; 
    expect(mockBotService.sendMessage).toHaveBeenCalledTimes(2);
  });
});
