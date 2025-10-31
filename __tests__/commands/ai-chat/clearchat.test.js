const clearchatCommand = require('../../../commands/ai-chat/clearchat.js');

describe('clearchat command', () => {
  let ctx;

  beforeEach(() => {
    ctx = {
      author: { id: 'user123' },
      bot: {
        context: {
          database: {
            chat: {
              clearHistory: jest.fn(),
            },
          },
          formatter: {
            quote: str => str,
          },
        },
      },
      reply: jest.fn(),
    };
  });

  it('should clear chat history and reply with a success message', async () => {
    await clearchatCommand.code(ctx);

    expect(ctx.bot.context.database.chat.clearHistory).toHaveBeenCalledWith('user123');
    expect(ctx.reply).toHaveBeenCalledWith('✅ Your chat history has been cleared.');
  });
});
