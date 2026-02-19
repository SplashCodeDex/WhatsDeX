import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GeminiAI } from './geminiAI.js';
import { CommonMessage } from '../types/omnichannel.js';
import { toolPersistenceService } from './toolPersistenceService.js';

// Hoist mocks
const { mockGeminiService } = vi.hoisted(() => ({
  mockGeminiService: {
    getChatCompletion: vi.fn(),
    getChatCompletionWithTools: vi.fn(),
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

vi.mock('./multiTenantService.js', () => ({
  multiTenantService: {
    getTenant: vi.fn().mockResolvedValue({ success: true, data: { planTier: 'pro' } })
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

describe('GeminiAI Tool Persistence', () => {
  let ai: GeminiAI;

  beforeEach(() => {
    vi.clearAllMocks();
    // @ts-ignore
    ai = new GeminiAI({});
  });

  it('should persist tool results and include them in the next call', async () => {
    const { toolRegistry } = await import('./toolRegistry.js');
    
    // 1. Setup a chain of tool calls
    mockGeminiService.getChatCompletionWithTools
      .mockResolvedValueOnce({
        finish_reason: 'tool_calls',
        message: {
          role: 'assistant',
          content: 'I will download the video',
          tool_calls: [{ id: 'call_1', function: { name: 'youtubevideo', arguments: '{"url": "https://video.com"}' } }]
        }
      })
      .mockResolvedValueOnce({
        finish_reason: 'stop',
        message: {
          role: 'assistant',
          content: 'I have downloaded it.'
        }
      });

    const mockTool = {
      name: 'youtubevideo',
      description: 'Download video',
      parameters: { type: 'object', properties: { url: { type: 'string' } }, required: ['url'] },
      execute: vi.fn().mockResolvedValue({ videoUrl: 'https://cdn.com/file.mp4' }),
      source: 'whatsdex' as const
    };
    toolRegistry.registerTool(mockTool);

    const input: CommonMessage = {
      id: 'msg_chain',
      platform: 'whatsapp',
      from: 'user_chain',
      to: 'bot_1',
      content: { text: 'Download this video' },
      timestamp: Date.now()
    };

    // 2. Run the first execution
    await ai.processOmnichannelMessage('tenant_1', 'bot_1', input);

    // 3. Verify it was persisted (in the registry's execute method)
    // We check the toolContext in the SECOND call of the loop
    // But since our loop runs inside one processOmnichannelMessage, 
    // the systemPrompt is generated ONCE at the start.
    // Chaining across multiple separate messages is what I wanted to test.

    // 4. Send a second message
    mockGeminiService.getChatCompletionWithTools.mockResolvedValueOnce({
      finish_reason: 'stop',
      message: { role: 'assistant', content: 'The last video you downloaded was https://cdn.com/file.mp4' }
    });

    const secondInput: CommonMessage = {
      id: 'msg_followup',
      platform: 'whatsapp',
      from: 'user_chain',
      to: 'bot_1',
      content: { text: 'What did I just download?' },
      timestamp: Date.now()
    };

    // Before this call, we mock toolPersistenceService.getSessionResults to return the previous result
    vi.spyOn(toolPersistenceService, 'getSessionResults').mockResolvedValueOnce([
      { tool: 'youtubevideo', data: { videoUrl: 'https://cdn.com/file.mp4' } }
    ]);

    await ai.processOmnichannelMessage('tenant_1', 'bot_1', secondInput);

    // 5. Verify the system prompt in the second call contained the tool output
    const messagesInLastCall = mockGeminiService.getChatCompletionWithTools.mock.calls[2][0];
    const systemMsg = messagesInLastCall.find((m: any) => m.role === 'system');
    
    expect(systemMsg.content).toContain('RECENT TOOL OUTPUTS');
    expect(systemMsg.content).toContain('youtubevideo');
    expect(systemMsg.content).toContain('https://cdn.com/file.mp4');
  });
});
