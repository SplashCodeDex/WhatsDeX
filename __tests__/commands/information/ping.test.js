const { performance } = require('perf_hooks');
const pingCommand = require('../../../commands/information/ping.js');

jest.mock('../../../utils/formatters', () => ({
  convertMsToDuration: jest.fn(ms => `${ms.toFixed(2)} ms`),
}));

describe('ping command', () => {
  let ctx;

  beforeEach(() => {
    jest.clearAllMocks();
    ctx = {
      reply: jest.fn().mockResolvedValue({ key: 'test-message-key' }),
      editMessage: jest.fn(),
      bot: {
        context: {
          formatter: {
            quote: str => str,
          },
        },
      },
    };
  });

  it('should reply with Pong! and edit the message with the response time', async () => {
    // Arrange
    const performanceSpy = jest
      .spyOn(performance, 'now')
      .mockReturnValueOnce(1000) // Start time
      .mockReturnValueOnce(1550); // End time

    // Act
    await pingCommand.code(ctx);

    // Assert
    expect(ctx.reply).toHaveBeenCalledWith('🏓 Pong!');
    expect(ctx.editMessage).toHaveBeenCalledWith(
      'test-message-key',
      '🏓 Pong! Merespon dalam 550.00 ms.'
    );

    performanceSpy.mockRestore();
  });

  it('should handle errors gracefully', async () => {
    // Arrange
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const testError = { message: 'Network Error' };
    ctx.reply
      .mockRejectedValueOnce(testError) // First call fails
      .mockResolvedValueOnce(true); // Second call (in catch block) succeeds

    // Act
    await pingCommand.code(ctx);

    // Assert
    expect(ctx.reply).toHaveBeenCalledTimes(2);
    expect(ctx.reply).toHaveBeenNthCalledWith(1, '🏓 Pong!');
    expect(ctx.reply).toHaveBeenNthCalledWith(2, 'An error occurred: Network Error');
    expect(ctx.editMessage).not.toHaveBeenCalled();
    consoleErrorSpy.mockRestore();
  });
});
