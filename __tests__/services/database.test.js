const { PrismaClient } = require('@prisma/client');
const DatabaseService = require('../../src/services/database');

jest.mock('@prisma/client');

describe('DatabaseService', () => {
  let mockPrisma;
  let dbService;

  beforeEach(() => {
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
      group: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        count: jest.fn(),
      },
      userGroup: {
        create: jest.fn(),
        delete: jest.fn(),
      },
      subscription: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        count: jest.fn(),
      },
      commandUsage: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        count: jest.fn(),
        groupBy: jest.fn(),
        aggregate: jest.fn(),
      },
      analytics: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        count: jest.fn(),
        groupBy: jest.fn(),
        aggregate: jest.fn(),
      },
      payment: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        count: jest.fn(),
        groupBy: jest.fn(),
        aggregate: jest.fn(),
      },
      $connect: jest.fn(),
      $disconnect: jest.fn(),
      $on: jest.fn(),
      $use: jest.fn(),
      $queryRaw: jest.fn(),
    };

    PrismaClient.mockImplementation(() => mockPrisma);
    dbService = new DatabaseService();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('initialization', () => {
    test('should initialize successfully', async () => {
      mockPrisma.$connect.mockResolvedValue();

      await dbService.connect();

      expect(mockPrisma.$connect).toHaveBeenCalled();
      expect(dbService.isConnected).toBe(true);
    });

    test('should handle initialization errors', async () => {
      const error = new Error('Connection failed');
      mockPrisma.$connect.mockRejectedValue(error);

      await expect(dbService.connect()).rejects.toThrow('Connection failed');
      expect(dbService.isConnected).toBe(false);
    });
  });

  describe('user operations', () => {
    const mockUser = {
      id: 'user-123',
      jid: '1234567890@s.whatsapp.net',
      name: 'Test User',
      email: 'test@example.com',
      xp: 100,
      level: 2,
      coin: 50,
      premium: false,
      banned: false,
      stripeCustomerId: null,
      ai_requests_used: 5,
      image_generations_used: 2,
      commands_used: 25,
      createdAt: new Date(),
      updatedAt: new Date(),
      groups: [],
      subscriptions: [],
    };

    test('should get user by ID', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      const result = await dbService.getUser('1234567890@s.whatsapp.net');

      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { jid: '1234567890@s.whatsapp.net' },
        include: {
          groups: {
            include: {
              group: true
            }
          },
          subscriptions: {
            include: {
              plan: true
            },
            where: {
              status: 'active'
            }
          }
        }
      });
      expect(result).toEqual(mockUser);
    });

    test('should create new user', async () => {
      const userData = {
        jid: '1234567890@s.whatsapp.net',
        name: 'New User',
      };

      mockPrisma.user.create.mockResolvedValue({ ...mockUser, ...userData });

      const result = await dbService.createUser(userData);

      expect(mockPrisma.user.create).toHaveBeenCalledWith({
        data: {
          jid: '1234567890@s.whatsapp.net',
          name: 'New User',
          phone: undefined,
          avatar: undefined,
          xp: 0,
          level: 1,
          coin: 0,
          premium: false,
          banned: false
        }
      });
      expect(result).toEqual(expect.objectContaining(userData));
    });

    test('should update user', async () => {
      const updateData = { name: 'Updated Name', xp: 150 };
      const updatedUser = { ...mockUser, ...updateData };

      mockPrisma.user.update.mockResolvedValue(updatedUser);

      const result = await dbService.updateUser('1234567890@s.whatsapp.net', updateData);

      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { jid: '1234567890@s.whatsapp.net' },
        data: updateData,
      });
      expect(result).toEqual(updatedUser);
    });
  });

  describe('health check', () => {
    test('should return healthy status when connected', async () => {
      mockPrisma.$queryRaw.mockResolvedValue();

      const health = await dbService.healthCheck();

      expect(health.status).toBe('healthy');
      expect(health.database).toBe('connected');
    });

    test('should return unhealthy status on error', async () => {
      mockPrisma.$queryRaw.mockRejectedValue(new Error('Connection failed'));

      const health = await dbService.healthCheck();

      expect(health.status).toBe('unhealthy');
      expect(health.database).toBe('disconnected');
      expect(health.error).toBe('Connection failed');
    });
  });

  describe('cleanup', () => {
    test('should disconnect from database', async () => {
      mockPrisma.$disconnect.mockResolvedValue();

      await dbService.disconnect();

      expect(mockPrisma.$disconnect).toHaveBeenCalled();
    });
  });
});