const createChatDatabase = require('../../database/chat');

describe('Chat Database', () => {
  let db;
  let chatDB;

  beforeEach(() => {
    // Mock simpl.db
    db = {
      has: jest.fn(),
      create: jest.fn(),
      get: jest.fn(),
      set: jest.fn(),
      delete: jest.fn(),
    };
    chatDB = createChatDatabase(db);
  });

  it('should create chat table if it does not exist', () => {
    db.has.mockReturnValue(false);
    createChatDatabase(db);
    expect(db.create).toHaveBeenCalledWith('chat', []);
  });

  it('should get user history', () => {
    const userId = 'user1';
    const history = [{ role: 'user', content: 'hello' }];
    db.get.mockReturnValue({ key: userId, history });

    const result = chatDB.getHistory(userId);

    expect(db.get).toHaveBeenCalledWith('chat', { key: userId });
    expect(result).toEqual(history);
  });

  it('should return empty array for new user', () => {
    const userId = 'user2';
    db.get.mockReturnValue(null);

    const result = chatDB.getHistory(userId);

    expect(result).toEqual([]);
  });

  it('should add a message to history', () => {
    const userId = 'user1';
    const message = { role: 'user', content: 'world' };
    const existingChat = { key: userId, history: [{ role: 'user', content: 'hello' }] };
    db.get.mockReturnValue(JSON.parse(JSON.stringify(existingChat))); // Deep copy

    chatDB.addHistory(userId, message);

    const expectedHistory = [...existingChat.history, message];
    expect(db.set).toHaveBeenCalledWith(
      'chat',
      {
        key: userId,
        history: expectedHistory,
      },
      { key: userId }
    );
  });

  it('should create history for new user and add message', () => {
    const userId = 'user2';
    const message = { role: 'user', content: 'hello' };
    db.get.mockReturnValue(null);

    chatDB.addHistory(userId, message);

    expect(db.set).toHaveBeenCalledWith(
      'chat',
      {
        key: userId,
        history: [message],
      },
      { key: userId }
    );
  });

  it('should clear user history', () => {
    const userId = 'user1';
    chatDB.clearHistory(userId);
    expect(db.delete).toHaveBeenCalledWith('chat', { key: userId });
  });
});
