const { PrismaClient } = require('@prisma/client');
const DatabaseService = require('../../src/services/database');
const { execSync } = require('child_process');
const fs = require('fs');

// The Migration tests will use the real Prisma client, so we will not mock it globally.
// const { PrismaClient } = require('@prisma/client');
// jest.mock('@prisma/client'); // Remove global mock

describe('DatabaseService', () => {
  let mockPrisma;
  let dbService;

  beforeEach(() => {
    // Mock Prisma Client only for the DatabaseService unit tests
    const mockPrismaClient = jest.fn(() => mockPrisma);
    jest.resetModules(); // Reset module registry to ensure new mock is used
    jest.doMock('@prisma/client', () => ({ PrismaClient: mockPrismaClient }));
    const { PrismaClient: MockedPrismaClient } = require('@prisma/client');

    mockPrisma = {
      user: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        count: jest.fn(),
        upsert: jest.fn(),
      },
      // ... (other mocked models)
      $connect: jest.fn(),
      $disconnect: jest.fn(),
      $on: jest.fn(),
      $use: jest.fn(),
      $queryRaw: jest.fn(),
    };

    dbService = new DatabaseService();
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.resetModules(); // Reset modules again after the test suite finishes
  });

  // ... (all the existing unit tests for DatabaseService)
  // ... (The code for initialization, user operations, health check, cleanup)
});

describe('Migrations', () => {
  let testPrisma;
  const dbPath = './test.db';

  beforeAll(async () => {
    // Set a test database URL
    process.env.DATABASE_URL = `file:${dbPath}`;

    // Use a fresh Prisma client instance for the migration tests
    const { PrismaClient } = require('@prisma/client');
    testPrisma = new PrismaClient();

    // Ensure database file is clean
    if (fs.existsSync(dbPath)) {
      fs.unlinkSync(dbPath);
    }

    // Connect and run migrations
    await testPrisma.$connect();
    execSync(`npx prisma migrate dev --name test-migrate --schema=./prisma/schema.prisma --skip-seed --skip-generate`, { stdio: 'inherit' });
  }, 30000); // Increase timeout for migrations

  afterAll(async () => {
    await testPrisma.$disconnect();
    // Clean up the test database file
    if (fs.existsSync(dbPath)) {
      fs.unlinkSync(dbPath);
    }
    // Restore the default DATABASE_URL to prevent side effects
    delete process.env.DATABASE_URL;
  });

  test('Models created after migrate', async () => {
    // Test User
    const user = await testPrisma.user.create({
      data: { name: 'test' }
    });
    expect(user).toHaveProperty('id');

    // Test UserViolation
    const violation = await testPrisma.userViolation.create({
      data: { userId: user.id, violationType: 'spam' }
    });
    expect(violation).toHaveProperty('severity', 'low');
  });
});
