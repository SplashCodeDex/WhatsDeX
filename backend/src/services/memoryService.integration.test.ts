import { describe, it, expect, vi, beforeEach } from 'vitest';
import { memoryService } from './memoryService.js';
import { GeminiAI } from './geminiAI.js';
import { CommonMessage } from '../types/omnichannel.js';

// Mock embedding service to return deterministic vectors
vi.mock('./embeddingService.js', () => ({
  embeddingService: {
    generateEmbedding: vi.fn(async (text: string) => {
      // Return a vector based on the first character to simulate similarity
      const charCode = text.charCodeAt(0) || 0;
      return { success: true, data: new Array(1536).fill(charCode / 255) };
    })
  }
}));

// Mock Firebase DB
const mockDocs: any[] = [];
vi.mock('../lib/firebase.js', () => ({
  db: {
    collection: vi.fn((name: string) => ({
      add: vi.fn(async (data: any) => {
        mockDocs.push(data);
        return { id: 'mock_id' };
      }),
      where: vi.fn(function(this: any, field: string, op: string, value: any) {
        return {
          ...this,
          _filters: [...(this._filters || []), { field, op, value }],
          orderBy: vi.fn().mockReturnThis(),
          limit: vi.fn().mockReturnThis(),
          get: vi.fn(async () => {
            let filtered = mockDocs;
            // Simplified mock filter logic
            if (field === 'scopeId') {
              filtered = mockDocs.filter(d => d.scopeId === value);
            } else if (field === 'userId') {
              filtered = mockDocs.filter(d => d.userId === value);
            }
            return {
              empty: filtered.length === 0,
              docs: filtered.map(d => ({ data: () => d }))
            };
          })
        };
      })
    })),
    batch: vi.fn(() => ({
      delete: vi.fn(),
      commit: vi.fn()
    }))
  }
}));

describe('Memory Scoping Integration', () => {
  let ai: GeminiAI;

  beforeEach(() => {
    mockDocs.length = 0;
    vi.clearAllMocks();
    // @ts-ignore
    ai = new GeminiAI({});
  });

  it('should isolate RAG context between WhatsApp and Telegram for the same user', async () => {
    const userId = 'user_123';

    // 1. Store a memory on WhatsApp
    await memoryService.storeConversation(userId, 'My secret WhatsApp code is 9999', {
      platform: 'whatsapp',
      chatId: userId
    });

    // 2. Query context on Telegram
    const telegramContext = await memoryService.retrieveRelevantContext(userId, 'What is my secret code?', {
      platform: 'telegram',
      chatId: userId
    });

    expect(telegramContext.success).toBe(true);
    if (telegramContext.success) {
      // Should NOT find the WhatsApp memory because scopeId differs ('whatsapp:user_123' vs 'telegram:user_123')
      expect(telegramContext.data).toHaveLength(0);
    }

    // 3. Query context on WhatsApp
    const whatsappContext = await memoryService.retrieveRelevantContext(userId, 'What is my secret code?', {
      platform: 'whatsapp',
      chatId: userId
    });

    expect(whatsappContext.success).toBe(true);
    if (whatsappContext.success) {
      // Should find the WhatsApp memory
      expect(whatsappContext.data).toHaveLength(1);
      expect(whatsappContext.data[0].content).toContain('9999');
    }
  });
});
