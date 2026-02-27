import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { getCampaignWorker } from './campaignWorker.js';
import { firebaseService } from '../services/FirebaseService.js';
import { groupService } from '../services/groupService.js';
import { multiTenantBotService } from '../services/multiTenantBotService.js';
import { TemplateService } from '../services/templateService.js';

// Hoist mocks
const { mockFirebase, mockGroupService, mockBotService, mockTemplateService } = vi.hoisted(() => ({
  mockFirebase: {
    getDoc: vi.fn(),
    getCollection: vi.fn(),
    setDoc: vi.fn(),
  },
  mockGroupService: {
    syncAllGroups: vi.fn(),
    syncGroup: vi.fn(),
  },
  mockBotService: {
    sendMessage: vi.fn(),
    getBotSocket: vi.fn(),
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

vi.mock('../services/groupService.js', () => ({
  groupService: mockGroupService
}));

vi.mock('../archive/multiTenantBotService.js', () => ({
  multiTenantBotService: mockBotService
}));

vi.mock('../services/templateService.js', () => ({
  TemplateService: { getInstance: () => mockTemplateService }
}));

vi.mock('../services/webhookService.js', () => ({
  webhookService: { dispatch: vi.fn().mockResolvedValue(undefined) }
}));

vi.mock('../services/socketService.js', () => ({
  socketService: { emitProgress: vi.fn() }
}));

// Mock BullMQ Worker
vi.mock('bullmq', () => ({
  Worker: vi.fn().mockImplementation(function() {
    return { on: vi.fn() };
  })
}));

describe('CampaignWorker Group Support', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should auto-sync groups if Firestore collection is empty', async () => {
    const tenantId = 'tenant_1';
    const campaign = {
      id: 'camp_1',
      templateId: 'tpl_1',
      audience: { type: 'groups', targetId: 'all' },
      distribution: { type: 'pool' },
      antiBan: { minDelay: 1, maxDelay: 2, aiSpinning: false, batchSize: 0 },
      stats: { sent: 0, failed: 0 }
    };

    const mockBots = [{ id: 'bot_1', status: 'connected' }];
    const mockGroups = [{ id: 'group_1@g.us', subject: 'Test Group' }];

    mockFirebase.getDoc.mockImplementation(async (col, id) => {
        if (col === 'campaigns') return campaign;
        return null;
    });

    mockFirebase.getCollection.mockImplementation(async (col) => {
        if (col === 'bots') return mockBots;
        if (col === 'groups') {
            // Return empty first, then return mockGroups after sync
            if (mockGroupService.syncAllGroups.mock.calls.length > 0) {
                return mockGroups;
            }
            return [];
        }
        return [];
    });

    mockTemplateService.getTemplate.mockResolvedValue({ success: true, data: { content: 'Hi' } });
    mockBotService.sendMessage.mockResolvedValue({ success: true });
    mockBotService.getBotSocket.mockReturnValue({ id: 'bot_1', tenantId, botId: 'bot_1' });

    const campaignWorkerInstance = getCampaignWorker() as any;

    const expectedActiveBot = { id: 'bot_1', tenantId, botId: 'bot_1' };
    mockBotService.getBotSocket.mockReturnValue(expectedActiveBot);

    await campaignWorkerInstance.processCampaign({ data: { tenantId, campaign } } as any);

    expect(mockGroupService.syncAllGroups).toHaveBeenCalledWith(expectedActiveBot);
    expect(mockBotService.sendMessage).toHaveBeenCalledWith(
        tenantId,
        'bot_1',
        expect.objectContaining({ to: 'group_1@g.us' })
    );
  });
});
