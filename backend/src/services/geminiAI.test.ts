import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GeminiAI } from './geminiAI.js';
import { cacheService } from './cache.js';
import { systemAuthorityService } from './SystemAuthorityService.js';
import { multiTenantService } from './multiTenantService.js';

// Hoist mocks
const { mockGeminiService } = vi.hoisted(() => ({
  mockGeminiService: {
    getChatCompletion: vi.fn(),
  }
}));

// Mock dependencies
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

vi.mock('./SystemAuthorityService.js', () => ({
  systemAuthorityService: {
    checkAuthority: vi.fn(),
    recordUsage: vi.fn(),
    getCapabilities: vi.fn(() => ({
      features: {
        aiMessageSpinning: true
      }
    }))
  }
}));

vi.mock('./multiTenantService.js', () => ({
  multiTenantService: {
    getTenant: vi.fn().mockResolvedValue({ success: true, data: { plan: 'pro' } })
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
