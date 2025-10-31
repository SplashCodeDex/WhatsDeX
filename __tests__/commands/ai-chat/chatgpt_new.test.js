const chatgptCommand = require('../../../commands/ai-chat/chatgpt.js');
const OpenAIService = require('../../../services/openai.js');
const aiChatDB = require('../../../database/ai_chat_database.js');
const aiTools = require('../../../tools/ai-tools.js');

// Mock dependencies
jest.mock('../../../services/openai.js');
// Explicitly mock the database module to prevent real connections
jest.mock('../../../database/ai_chat_database.js', () => ({
  getChat: jest.fn(),
  updateChat: jest.fn(),
}));

describe('New chatgpt command with Memory and Function Calling', () => {
  let ctx;

  beforeEach(() => {
    jest.clearAllMocks();

    ctx = {
      author: { id: 'user123' },
      args: ['hello'],
      bot: {
        cmd: {
          get: jest.fn().mockReturnValue({
            code: jest.fn().mockImplementation(mockCtx => {
              mockCtx.reply('mocked youtube search result');
            }),
          }),
        },
        context: {
          config: { api: { openai: 'test-key' } },
          formatter: { quote: str => str },
        },
      },
      reply: jest.fn(),
    };
  });

  it('should handle a simple chat conversation', async () => {
    const mockCompletion = { message: { content: 'world' } };
    aiChatDB.getChat.mockResolvedValue({ history: [], summary: '' });
    const getChatCompletionSpy = jest
      .spyOn(OpenAIService.prototype, 'getChatCompletion')
      .mockResolvedValue(mockCompletion);

    await chatgptCommand.code(ctx);

    expect(getChatCompletionSpy).toHaveBeenCalledTimes(1);
    expect(ctx.reply).toHaveBeenCalledWith('world');
    expect(aiChatDB.updateChat).toHaveBeenCalled();

    getChatCompletionSpy.mockRestore();
  });

  it('should trigger summarization when history is long', async () => {
    const longHistory = Array(20).fill({ role: 'user', content: 'test' });
    aiChatDB.getChat.mockResolvedValue({ history: longHistory, summary: '' });

    const getSummarySpy = jest
      .spyOn(OpenAIService.prototype, 'getSummary')
      .mockResolvedValue('This is a summary.');
    const mockCompletion = { message: { content: 'response after summary' } };
    const getChatCompletionSpy = jest
      .spyOn(OpenAIService.prototype, 'getChatCompletion')
      .mockResolvedValue(mockCompletion);

    await chatgptCommand.code(ctx);

    expect(getSummarySpy).toHaveBeenCalled();
    expect(aiChatDB.updateChat).toHaveBeenCalledWith(
      'user123',
      expect.objectContaining({
        summary: expect.stringContaining('This is a summary.'),
      })
    );
    expect(ctx.reply).toHaveBeenCalledWith('response after summary');

    getSummarySpy.mockRestore();
    getChatCompletionSpy.mockRestore();
  });

  it('should correctly handle a tool call', async () => {
    aiChatDB.getChat.mockResolvedValue({ history: [], summary: '' });

    const toolCallResponse = {
      finish_reason: 'tool_calls',
      message: {
        tool_calls: [
          {
            id: 'call_123',
            type: 'function',
            function: { name: 'youtubesearch', arguments: JSON.stringify({ query: 'cat videos' }) },
          },
        ],
      },
    };
    const finalResponse = { message: { content: 'I found a video.' } };

    const getChatCompletionSpy = jest
      .spyOn(OpenAIService.prototype, 'getChatCompletion')
      .mockResolvedValueOnce(toolCallResponse)
      .mockResolvedValueOnce(finalResponse);

    await chatgptCommand.code(ctx);

    expect(getChatCompletionSpy).toHaveBeenCalledTimes(2);
    expect(ctx.bot.cmd.get).toHaveBeenCalledWith('youtubesearch');
    expect(ctx.reply).toHaveBeenCalledWith('I found a video.');
    expect(aiChatDB.updateChat).toHaveBeenCalled();

    getChatCompletionSpy.mockRestore();
  });
});
