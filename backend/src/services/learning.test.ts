import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GeminiAI } from './geminiAI.js';
import { firebaseService } from './FirebaseService.js';

// Hoist mocks
const { mockGeminiService } = vi.hoisted(() => ({
  mockGeminiService: {
    getChatCompletion: vi.fn(),
  }
}));

// Mock dependencies
vi.mock('./gemini.js', () => {
  return {
    default: vi.fn().mockImplementation(function() {
      return mockGeminiService;
    })
  };
});

vi.mock('./FirebaseService.js', () => ({
  firebaseService: {
    getDoc: vi.fn(),
    setDoc: vi.fn(),
    getCollection: vi.fn(),
  }
}));

vi.mock('./cache.js', () => ({
  cacheService: {
    get: vi.fn(() => ({ success: false })),
    set: vi.fn(),
    createKey: vi.fn((val) => `hash_${val}`)
  }
}));

vi.mock('./database.js', () => ({
  databaseService: {
    user: {
      get: vi.fn(),
    }
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

describe('GeminiAI Learning', () => {
  let ai: GeminiAI;
  const mockBot = {
    tenantId: 'tenant_1',
    botId: 'bot_1',
    user: { name: 'TestBot' },
    config: { aiPersonality: 'friendly' }
  } as any;

  beforeEach(() => {
    vi.clearAllMocks();
    ai = new GeminiAI({} as any);
  });

  it('should extract and store facts during learnFromInteraction', async () => {
    const userId = 'user_1@s.whatsapp.net';
    const message = 'My name is Jules and I like pizza.';
    const intelligence = { confidence: 0.9 };
    const ctx = {
      isGroup: vi.fn(() => false),
      msg: { contentType: 'textMessage' }
    } as any;

    mockGeminiService.getChatCompletion.mockResolvedValue(JSON.stringify({
      facts: ['User name is Jules', 'User likes pizza'],
      preferences: { 'favorite_food': 'pizza' }
    }));

    (firebaseService.getDoc as any).mockResolvedValue(null); // No existing learning

    await ai.learnFromInteraction(mockBot, userId, message, intelligence, ctx);

    expect(firebaseService.setDoc).toHaveBeenCalledWith(
      'learning',
      userId,
      expect.objectContaining({
        userId,
        facts: expect.arrayContaining([
          expect.objectContaining({ content: 'User name is Jules' }),
          expect.objectContaining({ content: 'User likes pizza' })
        ]),
        preferences: { 'favorite_food': 'pizza' }
      }),
      'tenant_1'
    );
  });

  it('should retrieve learned facts during buildEnhancedContext', async () => {
    const userId = 'user_1@s.whatsapp.net';
    const existingLearning = {
      userId,
      facts: [{ content: 'User likes pizza', extractedAt: new Date() }],
      preferences: { 'favorite_food': 'pizza' }
    };

    (firebaseService.getDoc as any).mockResolvedValue(existingLearning);

    const mockCtx = {
      isGroup: vi.fn(() => false),
      msg: { contentType: 'textMessage' }
    } as any;

    const context = await ai.buildEnhancedContext(mockBot, userId, 'hello', mockCtx);

    expect(context.learnedFacts).toHaveLength(1);
    expect(context.learnedFacts[0].content).toBe('User likes pizza');
  });
});
