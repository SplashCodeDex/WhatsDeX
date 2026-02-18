import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GeminiAI } from './geminiAI.js';
import { CommonMessage } from '../types/omnichannel.js';

// Hoist mocks
const { mockGeminiService } = vi.hoisted(() => ({
  mockGeminiService: {
    getChatCompletion: vi.fn().mockResolvedValue('Hello from AI!'),
    getChatCompletionWithTools: vi.fn().mockResolvedValue({
      finish_reason: 'stop',
      message: { role: 'assistant', content: 'Hello from AI!' }
    }),
    getManager: vi.fn(() => ({
      execute: vi.fn((fn) => fn())
    }))
  }
}));

// Mock dependencies
vi.mock('./gemini.js', () => ({
  default: class {
    getChatCompletion = mockGeminiService.getChatCompletion;
    getChatCompletionWithTools = mockGeminiService.getChatCompletionWithTools;
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

  it('should call Gemini with tools', async () => {
    const input: CommonMessage = {
      id: 'msg_2',
      platform: 'discord',
      from: 'user_2',
      to: 'bot_1',
      content: { text: 'Help me' },
      timestamp: Date.now()
    };

    await ai.processOmnichannelMessage('tenant_1', 'bot_1', input);

    expect(mockGeminiService.getChatCompletionWithTools).toHaveBeenCalled();
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

    const { memoryService } = await import('./memoryService.js');
    expect(memoryService.storeConversation).toHaveBeenCalledWith(
      'user_3',
      'My name is Adema',
      expect.objectContaining({
        platform: 'whatsapp'
      })
    );
  });

  it('should execute a tool when requested by Gemini', async () => {
    const { toolRegistry } = await import('./toolRegistry.js');
    const mockTool = {
      name: 'test_tool',
      description: 'A test tool',
      parameters: { type: 'object', properties: {}, required: [] },
      execute: vi.fn().mockResolvedValue('Tool result'),
      source: 'whatsdex' as const
    };
    toolRegistry.registerTool(mockTool);

    // Mock first call as tool call, second call as final response
    mockGeminiService.getChatCompletionWithTools
      .mockResolvedValueOnce({
        finish_reason: 'tool_calls',
        message: {
          role: 'assistant',
          content: 'I need to use a tool',
          tool_calls: [{ id: 'call_1', function: { name: 'test_tool', arguments: '{}' } }]
        }
      })
      .mockResolvedValueOnce({
        finish_reason: 'stop',
        message: {
          role: 'assistant',
          content: 'The tool said: Tool result'
        }
      });

    const input: CommonMessage = {
      id: 'msg_4',
      platform: 'web',
      from: 'user_4',
      to: 'bot_1',
      content: { text: 'Run the test tool' },
      timestamp: Date.now()
    };

    const result = await ai.processOmnichannelMessage('tenant_1', 'bot_1', input);

    expect(mockTool.execute).toHaveBeenCalled();
    expect(result.data.content.text).toBe('The tool said: Tool result');
  });
});
