const claimCommand = require('../../../commands/profile/claim.js');
const formatters = require('../../../utils/formatters');
const { db } = require('../../../src/utils');

jest.mock('../../../src/utils', () => ({
  db: {
    get: jest.fn(),
    set: jest.fn(),
  },
}));

jest.mock('../../../utils/formatters', () => ({
  convertMsToDuration: jest.fn(ms => `${ms / 1000} seconds`),
}));

describe('claim command', () => {
  let ctx;
  let dateNowSpy;

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock Date.now()
    dateNowSpy = jest.spyOn(Date, 'now').mockReturnValue(1700000000000); // A fixed point in time

    ctx = {
      args: [],
      isOwner: false,
      sender: { jid: 'user123@s.whatsapp.net' },
      getId: jid => jid.split('@')[0],
      bot: {
        context: {
          formatter: {
            quote: str => str,
          },
          config: {
            msg: { footer: 'test-footer' },
          },
        },
      },
      reply: jest.fn(),
    };
  });

  afterEach(() => {
    dateNowSpy.mockRestore();
  });

  it('should successfully claim a daily reward', async () => {
    // Arrange
    ctx.args = ['daily'];
    db.get.mockResolvedValue({ level: 5, coin: 50, lastClaim: { daily: 0 } });

    // Act
    await claimCommand.code(ctx);

    // Assert
    expect(db.set).toHaveBeenCalledWith('user.user123.coin', 150);
    expect(db.set).toHaveBeenCalledWith('user.user123.lastClaim.daily', 1700000000000);
    expect(ctx.reply).toHaveBeenCalledWith(
      '✅ You successfully claimed the daily reward of 100 coins! Your current balance is 150.'
    );
  });

  it('should show an error if the claim type is invalid', async () => {
    // Arrange
    ctx.args = ['invalid_claim'];

    // Act
    await claimCommand.code(ctx);

    // Assert
    expect(ctx.reply).toHaveBeenCalledWith(
      '❎ Invalid claim type. Use ".claim list" to see available claims.'
    );
    expect(db.set).not.toHaveBeenCalled();
  });

  it('should show an error if the user level is too low', async () => {
    // Arrange
    ctx.args = ['weekly'];
    db.get.mockResolvedValue({ level: 10, coin: 50 }); // Level 15 required

    // Act
    await claimCommand.code(ctx);

    // Assert
    expect(ctx.reply).toHaveBeenCalledWith(
      '❎ You need to be level 15 to claim this. Your current level is 10.'
    );
  });

  it('should show an error if the claim is on cooldown', async () => {
    // Arrange
    ctx.args = ['daily'];
    const now = 1700000000000;
    const oneHourAgo = now - 60 * 60 * 1000;
    db.get.mockResolvedValue({ level: 5, coin: 50, lastClaim: { daily: oneHourAgo } });

    // Act
    await claimCommand.code(ctx);

    // Assert
    expect(ctx.reply).toHaveBeenCalledWith(
      '⏳ You have already claimed the daily reward. Please wait 82800 seconds.'
    );
  });

  it('should prevent owner from claiming', async () => {
    // Arrange
    ctx.args = ['daily'];
    ctx.isOwner = true;

    // Act
    await claimCommand.code(ctx);

    // Assert
    expect(ctx.reply).toHaveBeenCalledWith('❎ You have unlimited coins and cannot claim rewards.');
  });

  it('should show the list of available claims', async () => {
    // Arrange
    ctx.args = ['list'];

    // Act
    await claimCommand.code(ctx);

    // Assert
    expect(ctx.reply).toHaveBeenCalledWith({
      text: expect.stringContaining('daily (Daily reward)'),
      footer: 'test-footer',
    });
  });
});
