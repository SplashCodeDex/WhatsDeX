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

      await dbService.initialize();

      expect(mockPrisma.$connect).toHaveBeenCalled();
      expect(dbService.isInitialized).toBe(true);
    });

    test('should handle initialization errors', async () => {
      const error = new Error('Connection failed');
      mockPrisma.$connect.mockRejectedValue(error);

      await expect(dbService.initialize()).rejects.toThrow('Connection failed');
      expect(dbService.isInitialized).toBe(false);
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
    };

    test('should get user by ID', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      const result = await dbService.getUser('user-123');

      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user-123' },
      });
      expect(result).toEqual(mockUser);
    });

    test('should create new user', async () => {
      const userData = {
        jid: '1234567890@s.whatsapp.net',
        name: 'New User',
        email: 'new@example.com',
      };

      mockPrisma.user.create.mockResolvedValue({ ...mockUser, ...userData });

      const result = await dbService.createUser(userData);

      expect(mockPrisma.user.create).toHaveBeenCalledWith({
        data: expect.objectContaining(userData),
      });
      expect(result).toEqual(expect.objectContaining(userData));
    });

    test('should update user', async () => {
      const updateData = { name: 'Updated Name', xp: 150 };
      const updatedUser = { ...mockUser, ...updateData };

      mockPrisma.user.update.mockResolvedValue(updatedUser);

      const result = await dbService.updateUser('user-123', updateData);

      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-123' },
        data: updateData,
      });
      expect(result).toEqual(updatedUser);
    });

    test('should track usage correctly', async () => {
      const usageData = {
        userId: 'user-123',
        feature: 'ai_requests',
        amount: 3,
      };

      mockPrisma.user.update.mockResolvedValue({
        ...mockUser,
        ai_requests_used: mockUser.ai_requests_used + usageData.amount,
      });

      const result = await dbService.trackUsage(
        usageData.userId,
        usageData.feature,
        usageData.amount
      );

      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: usageData.userId },
        data: { ai_requests_used: usageData.amount },
      });
      expect(result.used).toBe(mockUser.ai_requests_used + usageData.amount);
    });
  });

  describe('subscription operations', () => {
    const mockSubscription = {
      id: 'sub-123',
      userId: 'user-123',
      stripeSubscriptionId: 'stripe_sub_123',
      planKey: 'pro',
      status: 'active',
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      cancelAtPeriodEnd: false,
      createdAt: new Date(),
    };

    test('should get user subscription', async () => {
      mockPrisma.subscription.findFirst.mockResolvedValue(mockSubscription);

      const result = await dbService.getUserSubscription('user-123');

      expect(mockPrisma.subscription.findFirst).toHaveBeenCalledWith({
        where: {
          userId: 'user-123',
          status: { in: ['active', 'trialing'] },
        },
        orderBy: { createdAt: 'desc' },
      });
      expect(result).toEqual(mockSubscription);
    });

    test('should create subscription', async () => {
      const subscriptionData = {
        userId: 'user-123',
        stripeSubscriptionId: 'stripe_sub_123',
        planKey: 'pro',
        status: 'active',
      };

      mockPrisma.subscription.create.mockResolvedValue({
        ...mockSubscription,
        ...subscriptionData,
      });

      const result = await dbService.createSubscription(subscriptionData);

      expect(mockPrisma.subscription.create).toHaveBeenCalledWith({
        data: expect.objectContaining(subscriptionData),
      });
      expect(result).toEqual(expect.objectContaining(subscriptionData));
    });

    test('should update subscription', async () => {
      const updateData = { status: 'canceled', cancelAtPeriodEnd: true };
      const updatedSubscription = { ...mockSubscription, ...updateData };

      mockPrisma.subscription.update.mockResolvedValue(updatedSubscription);

      const result = await dbService.updateSubscription('sub-123', updateData);

      expect(mockPrisma.subscription.update).toHaveBeenCalledWith({
        where: { id: 'sub-123' },
        data: updateData,
      });
      expect(result).toEqual(updatedSubscription);
    });
  });

  describe('analytics operations', () => {
    test('should record analytics event', async () => {
      const analyticsData = {
        metric: 'command_used',
        value: 1,
        category: 'usage',
        metadata: { command: '/help', userId: 'user-123' },
      };

      mockPrisma.analytics.create.mockResolvedValue({
        id: 'analytics-123',
        ...analyticsData,
        recordedAt: new Date(),
      });

      const result = await dbService.recordAnalytics(analyticsData);

      expect(mockPrisma.analytics.create).toHaveBeenCalledWith({
        data: expect.objectContaining(analyticsData),
      });
      expect(result).toEqual(expect.objectContaining(analyticsData));
    });

    test('should get usage statistics', async () => {
      const startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const endDate = new Date();

      const mockStats = [
        { category: 'ai-chat', _count: { id: 150 } },
        { category: 'downloader', _count: { id: 75 } },
        { category: 'entertainment', _count: { id: 50 } },
      ];

      mockPrisma.commandUsage.groupBy.mockResolvedValue(mockStats);

      const result = await dbService.getUsageStats(startDate, endDate);

      expect(mockPrisma.commandUsage.groupBy).toHaveBeenCalledWith({
        by: ['category'],
        where: {
          usedAt: {
            gte: startDate,
            lte: endDate,
          },
        },
        _count: { id: true },
      });
      expect(result).toEqual(mockStats);
    });
  });

  describe('payment operations', () => {
    const mockPayment = {
      id: 'payment-123',
      userId: 'user-123',
      amount: 999,
      currency: 'usd',
      status: 'completed',
      paymentMethod: 'stripe',
      transactionId: 'stripe_pi_123',
      description: 'Pro subscription payment',
      createdAt: new Date(),
    };

    test('should record payment', async () => {
      mockPrisma.payment.create.mockResolvedValue(mockPayment);

      const result = await dbService.recordPayment({
        userId: 'user-123',
        amount: 999,
        currency: 'usd',
        status: 'completed',
        paymentMethod: 'stripe',
        transactionId: 'stripe_pi_123',
        description: 'Pro subscription payment',
      });

      expect(mockPrisma.payment.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: 'user-123',
          amount: 999,
          status: 'completed',
        }),
      });
      expect(result).toEqual(mockPayment);
    });

    test('should get user payments', async () => {
      const mockPayments = [mockPayment];
      mockPrisma.payment.findMany.mockResolvedValue(mockPayments);

      const result = await dbService.getUserPayments('user-123');

      expect(mockPrisma.payment.findMany).toHaveBeenCalledWith({
        where: { userId: 'user-123' },
        orderBy: { createdAt: 'desc' },
      });
      expect(result).toEqual(mockPayments);
    });
  });

  describe('health check', () => {
    test('should return healthy status when connected', async () => {
      mockPrisma.user.count.mockResolvedValue(100);
      mockPrisma.$connect.mockResolvedValue();

      const health = await dbService.healthCheck();

      expect(health.status).toBe('healthy');
      expect(health.service).toBe('database');
      expect(health.userCount).toBe(100);
    });

    test('should return unhealthy status on error', async () => {
      mockPrisma.user.count.mockRejectedValue(new Error('Connection failed'));

      const health = await dbService.healthCheck();

      expect(health.status).toBe('unhealthy');
      expect(health.service).toBe('database');
      expect(health.error).toBe('Connection failed');
    });
  });

  describe('cleanup', () => {
    test('should disconnect from database', async () => {
      mockPrisma.$disconnect.mockResolvedValue();

      await dbService.close();

      expect(mockPrisma.$disconnect).toHaveBeenCalled();
    });
  });
});