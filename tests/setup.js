/**
 * Jest test setup file
 * Configures test environment and global utilities
 */

// Load environment variables for testing
require('dotenv').config({ path: '.env.test' });

// Mock external dependencies
jest.mock('@whiskeysockets/baileys', () => ({ default: jest.fn().mockReturnValue({ ev: { on: jest.fn() }, sendMessage: jest.fn(), logout: jest.fn() }), useMultiFileAuthState: jest.fn().mockResolvedValue({ state: {}, saveCreds: jest.fn() }), DisconnectReason: { loggedOut: 'loggedOut' }, S_WHATSAPP_NET: '@s.whatsapp.net' }));

const Formatter = {
    quote: (text) => `_${text}_`,
    italic: (text) => `_${text}_`,
    bold: (text) => `*${text}*`,
    monospace: (text) => ``${text}````,
};

// Mock Prisma
jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn().mockImplementation(() => ({
    $connect: jest.fn(),
    $disconnect: jest.fn(),
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      upsert: jest.fn()
    },
    group: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn()
    },
    $queryRaw: jest.fn()
  }))
}));

// Global test utilities
global.testUtils = {
  // Create mock WhatsApp context
  createMockContext: (overrides = {}) => ({
    used: { command: 'test', prefix: '!' },
    args: [],
    msg: { text: 'test message' },
    sender: { jid: '1234567890@s.whatsapp.net' },
    getId: (jid) => jid.split('@')[0],
    reply: jest.fn(),
    replyReact: jest.fn(),
    isGroup: () => false,
    getMessage: () => 'test message',
    ...overrides
  }),

  // Create mock database user
  createMockUser: (overrides = {}) => ({
    id: 'user-123',
    jid: '1234567890@s.whatsapp.net',
    name: 'Test User',
    xp: 100,
    level: 1,
    coin: 50,
    premium: false,
    banned: false,
    lastActivity: new Date(),
    ...overrides
  }),

  // Create mock database group
  createMockGroup: (overrides = {}) => ({
    id: 'group-123',
    jid: '120363123456789012@g.us',
    name: 'Test Group',
    memberCount: 10,
    ownerJid: '1234567890@s.whatsapp.net',
    ...overrides
  }),

  // Wait for async operations
  wait: (ms) => new Promise(resolve => setTimeout(resolve, ms)),

  // Clean up after tests
  cleanup: async () => {
    // Reset all mocks
    jest.clearAllMocks();

    // Clean up any test files
    const fs = require('fs').promises;
    const path = require('path');

    const testFiles = [
      'test.db',
      'test.db-journal'
    ];

    for (const file of testFiles) {
      try {
        await fs.unlink(path.join(__dirname, '..', file));
      } catch (error) {
        // File doesn't exist, continue
      }
    }
  }
};

// Set up test environment
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = 'file:./test.db';

// Global beforeEach
beforeEach(() => {
  jest.clearAllMocks();
});

// Global afterEach
afterEach(async () => {
  await global.testUtils.cleanup();
});

// Global afterAll
afterAll(async () => {
  await global.testUtils.cleanup();
});