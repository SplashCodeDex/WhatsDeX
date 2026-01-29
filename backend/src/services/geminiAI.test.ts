import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GeminiAI } from './geminiAI.js';
import { cacheService } from './cache.js';

// Hoist mocks
const { mockGeminiService, mockDb } = vi.hoisted(() => ({
  mockGeminiService: {
    getChatCompletion: vi.fn(),
  },
  mockDb: {
    collection: vi.fn().mockReturnThis(),
    doc: vi.fn().mockReturnThis(),
    get: vi.fn(),
    set: vi.fn(),
    runTransaction: vi.fn(),
  }
}));

// Mock dependencies
vi.mock('../lib/firebase.js', () => ({
  db: mockDb,
  admin: {
    firestore: {
      Timestamp: {
        now: vi.fn(() => ({ toDate: () => new Date() }))
      }
    }
  }
}));

vi.mock('../lib/apiKeyManager.js', () => ({
  ApiKeyManager: {
    getInstance: vi.fn(() => ({
      success: true,
      data: {
        getKey: vi.fn(() => ({ success: true, data: 'mock-key' })),
        getStats: vi.fn(() => ({ totalKeys: 1, healthyKeys: 1 })),
        markSuccess: vi.fn(),
        markFailed: vi.fn(),
        getKeyCount: vi.fn(() => 1)
      }
    }))
  },
  isQuotaError: vi.fn(() => false)
}));

vi.mock('./gemini.js', () => {
  return {
    default: vi.fn().mockImplementation(function() {
      return mockGeminiService;
    })
  };
});

vi.mock('./cache.js', () => ({
  cacheService: {
    get: vi.fn(),
    set: vi.fn(),
    createKey: vi.fn((val) => `hash_${val}`)
  }
}));

vi.mock('./database.js', () => ({
  databaseService: {
    user: {
      get: vi.fn().mockResolvedValue({ id: 'user_1', name: 'Test User' })
    }
  }
}));

vi.mock('./memoryService.js', () => ({
  memoryService: {
    retrieveRelevantContext: vi.fn().mockResolvedValue({ success: true, data: [] }),
    storeConversation: vi.fn().mockResolvedValue({ success: true })
  }
}));

vi.mock('../utils/logger.js', () => ({
  default: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn()
  }
}));

describe('GeminiAI.spinMessage', () => {
  let ai: GeminiAI;

  beforeEach(() => {
    vi.clearAllMocks();
    // @ts-ignore
    ai = new GeminiAI({});
  });

  it('should spin a message and return the new version', async () => {
    const original = "Hello {{name}}, welcome to our service!";
    const spun = "Hi {{name}}, we're glad to have you here!";
    
    mockGeminiService.getChatCompletion.mockResolvedValue(spun);
    (cacheService.get as any).mockResolvedValue({ success: false });

    const result = await ai.spinMessage(original, 'tenant_1');

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toBe(spun);
    }
    expect(mockGeminiService.getChatCompletion).toHaveBeenCalledWith(expect.stringContaining(original));
  });

  it('should return memoized result if available (Rule 5)', async () => {
    const original = "Hello!";
    const cached = "Hi there!";
    
    (cacheService.get as any).mockResolvedValue({ success: true, data: cached });

    const result = await ai.spinMessage(original, 'tenant_1');

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toBe(cached);
    }
    expect(mockGeminiService.getChatCompletion).not.toHaveBeenCalled();
  });
});

describe('GeminiAI Learning', () => {
  let ai: GeminiAI;

  beforeEach(() => {
    vi.clearAllMocks();
    // @ts-ignore
    ai = new GeminiAI({});
  });

  describe('learnFromInteraction', () => {
    it('should extract facts and store them in Firestore', async () => {
      const bot = { tenantId: 'tenant_1' } as any;
      const ctx = { replied: true } as any;
      const facts = ['User likes coffee'];
      mockGeminiService.getChatCompletion.mockResolvedValue(JSON.stringify(facts));

      mockDb.runTransaction.mockImplementation(async (callback: any) => {
        const transaction = {
          get: vi.fn().mockResolvedValue({ exists: false }),
          set: vi.fn(),
        };
        await callback(transaction);
        expect(transaction.set).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({
          facts: expect.arrayContaining(facts)
        }), { merge: true });
      });

      await ai.learnFromInteraction(bot, 'user_1', 'I like coffee', {}, ctx, 'Great!');

      expect(mockGeminiService.getChatCompletion).toHaveBeenCalledWith(expect.stringContaining('Extract any new personal facts'));
    });
  });

  describe('buildEnhancedContext', () => {
    it('should include learned facts in the context', async () => {
      const bot = { tenantId: 'tenant_1' } as any;
      const facts = ['User likes coffee'];
      const ctx = {
        isGroup: vi.fn().mockReturnValue(false),
        msg: { contentType: 'text' }
      } as any;

      mockDb.get.mockResolvedValue({
        exists: true,
        data: () => ({ facts })
      });

      const context = await ai.buildEnhancedContext(bot, 'user_1', 'Hello', ctx);

      expect(context.learnedFacts).toEqual(facts);
      expect(mockDb.collection).toHaveBeenCalledWith('tenants');
    });
  });
});
