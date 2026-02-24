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

vi.mock('./multiTenantService.js', () => ({
  multiTenantService: {
    getTenant: vi.fn().mockResolvedValue({
      success: true,
      data: { plan: 'starter' }
    })
  }
}));

vi.mock('./skillsManager.js', () => ({
  skillsManager: {
    isTenantEligible: vi.fn().mockResolvedValue(true)
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

  it('should execute multiple tools in parallel when requested by Gemini', async () => {
    const { toolRegistry } = await import('./toolRegistry.js');
    const tool1 = {
      name: 'tool1',
      description: 'First tool',
      parameters: { type: 'object', properties: {}, required: [] },
      execute: vi.fn().mockResolvedValue('Result 1'),
      source: 'whatsdex' as const
    };
    const tool2 = {
      name: 'tool2',
      description: 'Second tool',
      parameters: { type: 'object', properties: {}, required: [] },
      execute: vi.fn().mockResolvedValue('Result 2'),
      source: 'whatsdex' as const
    };
    toolRegistry.registerTool(tool1);
    toolRegistry.registerTool(tool2);

    mockGeminiService.getChatCompletionWithTools
      .mockResolvedValueOnce({
        finish_reason: 'tool_calls',
        message: {
          role: 'assistant',
          content: 'I need to use two tools',
          tool_calls: [
            { id: 'call_1', function: { name: 'tool1', arguments: '{}' } },
            { id: 'call_2', function: { name: 'tool2', arguments: '{}' } }
          ]
        }
      })
      .mockResolvedValueOnce({
        finish_reason: 'stop',
        message: {
          role: 'assistant',
          content: 'Both tools finished.'
        }
      });

    const input: CommonMessage = {
      id: 'msg_parallel',
      platform: 'web',
      from: 'user_parallel',
      to: 'bot_1',
      content: { text: 'Run both tools' },
      timestamp: Date.now()
    };

    const result = await ai.processOmnichannelMessage('tenant_1', 'bot_1', input);

    expect(tool1.execute).toHaveBeenCalled();
    expect(tool2.execute).toHaveBeenCalled();
    expect(result.data.content.text).toBe('Both tools finished.');
  });

  it('should prompt for upgrade when a tool is gated by tier', async () => {
    const { multiTenantService } = await import('./multiTenantService.js');
    const { skillsManager } = await import('./skillsManager.js');

    // Set plan to starter
    vi.mocked(multiTenantService.getTenant).mockResolvedValueOnce({
      success: true,
      data: { plan: 'starter' }
    } as any);

    // Mock tool as ineligible for starter
    vi.mocked(skillsManager.isTenantEligible).mockResolvedValueOnce(false);

    // Mock Gemini wanting to call a premium tool
    mockGeminiService.getChatCompletionWithTools
      .mockResolvedValueOnce({
        finish_reason: 'tool_calls',
        message: {
          role: 'assistant',
          content: 'I will search the web',
          tool_calls: [{ id: 'call_prem', function: { name: 'web_search', arguments: '{"query": "news"}' } }]
        }
      })
      .mockResolvedValueOnce({
        finish_reason: 'stop',
        message: {
          role: 'assistant',
          content: 'You need to upgrade to Pro to use web search.'
        }
      });

    const input: CommonMessage = {
      id: 'msg_tier',
      platform: 'whatsapp',
      from: 'user_tier',
      to: 'bot_1',
      content: { text: 'Search the web' },
      timestamp: Date.now()
    };

    const result = await ai.processOmnichannelMessage('tenant_tier', 'bot_1', input);

    expect(result.success).toBe(true);
    expect(result.data.content.text).toContain('upgrade');
    expect(vi.mocked(skillsManager.isTenantEligible)).toHaveBeenCalledWith('tenant_tier', 'web_search', 'starter');
  });
});
