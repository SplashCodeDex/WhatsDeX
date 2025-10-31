// Make sure the mock includes everything expected by the DatabaseService constructor
const mockPrisma = {
  user: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
    upsert: jest.fn(),
  },
  $connect: jest.fn(),
  $disconnect: jest.fn(),
  $on: jest.fn(), // <--- This is the key addition to fix the TypeError
  $use: jest.fn(),
  $queryRaw: jest.fn(),
};

jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn(() => mockPrisma),
}));

const transferCommand = require('../../../commands/profile/transfer.js');</search>
</search_and_replace>

describe('transfer command', () => {
  let ctx;

  beforeEach(() => {
    // Mock the global db object used by the command
    global.db = {
      get: jest.fn(),
      add: jest.fn(),
      subtract: jest.fn(),
    };

    ctx = {
      args: [],
      quoted: null,
      isOwner: false,
      sender: { jid: 'sender@s.whatsapp.net' },
      getMentioned: jest.fn().mockResolvedValue([]),
      getId: jid => jid.split('@')[0],
      core: {
        onWhatsApp: jest.fn().mockResolvedValue(['exists']),
      },
      bot: {
        context: {
          formatter: {
            quote: str => str,
          },
        },
      },
      reply: jest.fn(),
    };
  });

  it('should successfully transfer coins to a mentioned user', async () => {
    // Arrange
    ctx.getMentioned.mockResolvedValue(['receiver@s.whatsapp.net']);
    ctx.args = ['@receiver', '100'];
    db.get.mockResolvedValue({ coin: 500 }); // Sender has enough coins

    // Act
    await transferCommand.code(ctx);

    // Assert
    expect(db.subtract).toHaveBeenCalledWith('user.sender.coin', 100);
    expect(db.add).toHaveBeenCalledWith('user.receiver.coin', 100);
    expect(ctx.reply).toHaveBeenCalledWith('✅ Successfully transferred 100 coins!');
  });

  it('should reply with an error for a non-positive amount', async () => {
    // Arrange
    ctx.getMentioned.mockResolvedValue(['receiver@s.whatsapp.net']);
    ctx.args = ['@receiver', '-50'];

    // Act
    await transferCommand.code(ctx);

    // Assert
    expect(ctx.reply).toHaveBeenCalledWith(
      '❎ Invalid amount: The amount must be a positive whole number.'
    );
    expect(db.add).not.toHaveBeenCalled();
  });

  it('should reply with an error for a non-numeric amount', async () => {
    // Arrange
    ctx.getMentioned.mockResolvedValue(['receiver@s.whatsapp.net']);
    ctx.args = ['@receiver', 'abc'];

    // Act
    await transferCommand.code(ctx);

    // Assert
    expect(ctx.reply).toHaveBeenCalledWith(
      '❎ Invalid amount: Invalid input: expected number, received NaN'
    );
    expect(db.add).not.toHaveBeenCalled();
  });

  it('should reply with an error if the user has insufficient coins', async () => {
    // Arrange
    ctx.getMentioned.mockResolvedValue(['receiver@s.whatsapp.net']);
    ctx.args = ['@receiver', '100'];
    db.get.mockResolvedValue({ coin: 50 }); // Sender has insufficient coins

    // Act
    await transferCommand.code(ctx);

    // Assert
    expect(ctx.reply).toHaveBeenCalledWith('❎ You do not have enough coins for this transfer!');
    expect(db.add).not.toHaveBeenCalled();
  });

  it('should reply with help message if no user or amount is provided', async () => {
    // Arrange
    ctx.args = [];

    // Act
    await transferCommand.code(ctx);

    // Assert
    expect(ctx.reply).toHaveBeenCalledWith(
      'Please specify a user and an amount to transfer.\n\nExample: .transfer @user 100'
    );
  });
});
