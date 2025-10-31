const validateCommand = require('../../middleware/inputValidation');

describe('inputValidation middleware', () => {
  const mockContext = {
    database: {
      auditLog: {
        create: jest.fn().mockResolvedValue(true),
      },
    },
  };

  const mockCtx = {
    used: {
      prefix: '!',
      command: 'youtubevideo',
    },
    args: [],
    sender: { jid: 'testuser' },
    reply: jest.fn().mockResolvedValue(true),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('valid YouTube URL for youtubevideo', async () => {
    mockCtx.args = ['https://www.youtube.com/watch?v=dQw4w9WgXcQ'];
    const result = await validateCommand(mockCtx, mockContext);
    expect(result).toBe(true);
    expect(mockCtx.reply).not.toHaveBeenCalled();
    expect(mockContext.database.auditLog.create).not.toHaveBeenCalled();
  });

  test('invalid URL for youtubevideo', async () => {
    mockCtx.args = ['invalid-url'];
    mockCtx.used.command = 'youtubevideo';
    const result = await validateCommand(mockCtx, mockContext);
    expect(result).toBe(false);
    expect(mockCtx.reply).toHaveBeenCalledWith(expect.stringContaining('Invalid input'));
    expect(mockContext.database.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: 'input_validation_fail',
        action: 'Invalid input for command youtubevideo',
        actor: 'testuser',
      })
    );
  });

  test('valid prompt for chatgpt', async () => {
    mockCtx.args = ['Hello, how are you?'];
    mockCtx.used.command = 'chatgpt';
    const result = await validateCommand(mockCtx, mockContext);
    expect(result).toBe(true);
    expect(mockCtx.reply).not.toHaveBeenCalled();
  });

  test('invalid prompt too long for chatgpt', async () => {
    const longPrompt = 'a'.repeat(2001);
    mockCtx.args = [longPrompt];
    mockCtx.used.command = 'chatgpt';
    const result = await validateCommand(mockCtx, mockContext);
    expect(result).toBe(false);
    expect(mockCtx.reply).toHaveBeenCalledWith(expect.stringContaining('Invalid input'));
    expect(mockContext.database.auditLog.create).toHaveBeenCalled();
  });

  test('unknown command allows execution', async () => {
    mockCtx.used.command = 'unknown';
    mockCtx.args = ['test'];
    const result = await validateCommand(mockCtx, mockContext);
    expect(result).toBe(true);
    expect(mockCtx.reply).not.toHaveBeenCalled();
  });
});
