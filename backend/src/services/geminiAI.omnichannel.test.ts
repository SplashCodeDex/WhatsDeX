import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GeminiAI } from './geminiAI.js';
import { CommonMessage } from '../types/omnichannel.js';

// Hoist mocks
const { mockGeminiService } = vi.hoisted(() => ({
  mockGeminiService: {
    getChatCompletion: vi.fn().mockResolvedValue('Hello from AI!'),
    getManager: vi.fn(() => ({
      execute: vi.fn((fn) => fn())
    }))
  }
}));

// Mock dependencies
vi.mock('./gemini.js', () => ({
  default: class {
    getChatCompletion = mockGeminiService.getChatCompletion;
    getManager = mockGeminiService.getManager;
  }
}));

vi.mock('./memoryService.js', () => ({
  memoryService: {
    retrieveRelevantContext: vi.fn().mockResolvedValue({ success: true, data: [] }),
    storeConversation: vi.fn().mockResolvedValue({ success: true })
  }
}));

vi.mock('./FirebaseService.js', () => ({
  firebaseService: {
    getDoc: vi.fn().mockResolvedValue({ facts: [], preferences: {} }),
    setDoc: vi.fn().mockResolvedValue({ success: true })
  }
}));

vi.mock('./database.js', () => ({
  databaseService: {
    user: {
      get: vi.fn().mockResolvedValue({ id: 'user_1', name: 'Test User' })
    }
  }
}));

vi.mock('./cache.js', () => ({
  cacheService: {
    get: vi.fn().mockResolvedValue({ success: false }),
    set: vi.fn().mockResolvedValue(true),
    createKey: vi.fn((val) => `hash_${val}`)
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

describe('GeminiAI Omnichannel Support', () => {
  let ai: GeminiAI;

  beforeEach(() => {
    vi.clearAllMocks();
    // @ts-ignore
    ai = new GeminiAI({});
  });

  it('should process a CommonMessage and return a CommonMessage response', async () => {
    const input: CommonMessage = {
      id: 'msg_1',
      platform: 'telegram',
      from: 'user_1',
      to: 'bot_1',
      content: { text: 'Hello AI' },
      timestamp: Date.now()
    };

    const result = await ai.processOmnichannelMessage('tenant_1', 'bot_1', input);

    expect(result.success).toBe(true);
    expect(result.data.content.text).toBe('Hello from AI!');
    expect(result.data.platform).toBe('telegram');
    expect(result.data.to).toBe('user_1'); // Response goes back to sender
  });

  it('should include platform context in the system prompt', async () => {
    const input: CommonMessage = {
      id: 'msg_2',
      platform: 'discord',
      from: 'user_2',
      to: 'bot_1',
      content: { text: 'What platform is this?' },
      timestamp: Date.now()
    };

    await ai.processOmnichannelMessage('tenant_1', 'bot_1', input);

    expect(mockGeminiService.getChatCompletion).toHaveBeenCalledWith(
      expect.stringContaining('Platform: discord')
    );
  });

  it('should maintain conversation memory across omnichannel messages', async () => {
    const input: CommonMessage = {
      id: 'msg_3',
      platform: 'whatsapp',
      from: 'user_3',
      to: 'bot_1',
      content: { text: 'My name is Adema' },
      timestamp: Date.now()
    };

    await ai.processOmnichannelMessage('tenant_1', 'bot_1', input);

    expect(vi.mocked(await import('./memoryService.js')).memoryService.storeConversation).toHaveBeenCalledWith(
      'user_3',
      'My name is Adema',
      expect.objectContaining({
        platform: 'whatsapp'
      })
    );
  });
});
