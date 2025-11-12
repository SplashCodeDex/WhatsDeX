import DatabaseService from '../../src/services/database.js';

const { execSync } = require('child_process');
const fs = require('fs');

// Mock Prisma Client globally for DatabaseService unit tests
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
  $on: jest.fn((event, callback) => {
    // Mock the event listener
    if (event === 'query') {
      // Mock query event
    }
  }),
  $use: jest.fn(),
  $queryRaw: jest.fn(),
};

// jest.mock('@prisma/client', () => ({
//   PrismaClient: jest.fn(() => mockPrisma),
// }));

describe('DatabaseService', () => {
  let dbService;

  beforeEach(() => {
    dbService = new DatabaseService();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ... (all the existing unit tests for DatabaseService)
  // ... (The code for initialization, user operations, health check, cleanup)
  test('should be defined', () => {
    expect(dbService).toBeDefined();
  });
});

// describe('Migrations', () => {
//   let testPrisma;

//   beforeAll(async () => {
//     // Set a test database URL for PostgreSQL
//     process.env.DATABASE_URL = 'postgresql://postgres:password@localhost:5432/testdb?schema=public';

//     // Use a fresh Prisma client instance for the migration tests
//     const { PrismaClient } = require('@prisma/client');
//     testPrisma = new PrismaClient();

//     // Connect and run migrations
//     await testPrisma.$connect();
//     try {
//       execSync(
//         `npx prisma migrate dev --name test-migrate --schema=./prisma/schema.prisma --skip-seed --skip-generate`,
//         { stdio: 'inherit' }
//       );
//     } catch (error) {
//       console.error('Migration failed:', error);
//       throw error;
//     }
//     await testPrisma.$disconnect();
//     await testPrisma.$connect();
//   }, 30000); // Increase timeout for migrations

//   afterAll(async () => {
//     await testPrisma.$disconnect();
//     // Restore the default DATABASE_URL to prevent side effects
//     delete process.env.DATABASE_URL;
//   });

//   test('Models created after migrate', async () => {
//     // Test User
//     const user = await testPrisma.user.create({
//       data: { name: 'test', jid: 'testuser@s.whatsapp.net' },
//     });
//     console.log('Created user:', user); // Debug check
//     expect(user).toBeDefined(); // Debug check
//     expect(user).toHaveProperty('id');

//     // Test UserViolation
//     const violation = await testPrisma.userViolation.create({
//       data: {
//         userId: user.id,
//         violationType: 'spam',
//         reason: 'Test violation',
//         severity: 'low', // Explicitly adding the required 'severity' field
//       },
//     });
//     expect(violation).toHaveProperty('severity', 'low');
//   });
// });
