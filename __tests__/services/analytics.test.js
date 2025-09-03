const WebSocket = require('ws');
const AnalyticsService = require('../../src/services/analytics');

jest.mock('ws');

describe('AnalyticsService', () => {
  let mockDatabase;
  let analyticsService;
  let mockWss;

  beforeEach(() => {
    mockDatabase = {
      prisma: {
        user: {
          count: jest.fn(),
          groupBy: jest.fn(),
        },
        commandUsage: {
          count: jest.fn(),
          groupBy: jest.fn(),
          aggregate: jest.fn(),
          findMany: jest.fn(),
        },
        analytics: {
          create: jest.fn(),
        },
      },
    };

    mockWss = {
      on: jest.fn(),
    };

    WebSocket.Server.mockImplementation(() => mockWss);

    analyticsService = new AnalyticsService(mockDatabase);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('initialization', () => {
    test('should initialize successfully', async () => {
      const config = { websocketPort: 8080 };

      await analyticsService.initialize(config);

      expect(WebSocket.Server).toHaveBeenCalledWith({ port: 8080 });
      expect(analyticsService.isInitialized).toBe(true);
    });

    test('should initialize without WebSocket', async () => {
      const config = {};

      await analyticsService.initialize(config);

      expect(WebSocket.Server).not.toHaveBeenCalled();
      expect(analyticsService.isInitialized).toBe(true);
    });
  });

  describe('WebSocket handling', () => {
    beforeEach(async () => {
      await analyticsService.initialize({ websocketPort: 8080 });
    });

    test('should handle subscribe message', async () => {
      const mockWs = {
        readyState: WebSocket.OPEN,
        send: jest.fn(),
      };

      const mockMessage = JSON.stringify({
        type: 'subscribe',
      });

      await analyticsService.handleWebSocketMessage(mockWs, mockMessage);

      expect(mockWs.send).toHaveBeenCalledWith(
        JSON.stringify({
          type: 'subscribed',
          data: { message: 'Successfully subscribed to real-time updates' },
        })
      );
    });

    test('should handle get_metrics message', async () => {
      const mockWs = {
        readyState: WebSocket.OPEN,
        send: jest.fn(),
      };

      const mockMetrics = {
        userGrowth: [],
        commandUsage: [],
        revenue: [],
        errorRate: [],
        summary: {
          totalUsers: 100,
          totalCommands: 500,
          totalRevenue: 5000,
        },
      };

      analyticsService.getMetrics = jest.fn().mockResolvedValue(mockMetrics);

      const mockMessage = JSON.stringify({
        type: 'get_metrics',
        timeframe: '24h',
      });

      await analyticsService.handleWebSocketMessage(mockWs, mockMessage);

      expect(analyticsService.getMetrics).toHaveBeenCalledWith('24h');
      expect(mockWs.send).toHaveBeenCalledWith(
        JSON.stringify({
          type: 'metrics',
          data: mockMetrics,
        })
      );
    });

    test('should handle invalid JSON', async () => {
      const mockWs = {
        readyState: WebSocket.OPEN,
        send: jest.fn(),
      };

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      await analyticsService.handleWebSocketMessage(mockWs, 'invalid json');

      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe('metrics collection', () => {
    beforeEach(async () => {
      await analyticsService.initialize({});
    });

    test('should update metrics successfully', async () => {
      const mockUsers = [
        { lastActivity: new Date() },
        { lastActivity: new Date() },
      ];

      const mockCommands = [
        { usedAt: new Date() },
        { usedAt: new Date() },
      ];

      mockDatabase.prisma.user.count.mockResolvedValue(2);
      mockDatabase.prisma.commandUsage.count.mockResolvedValue(2);
      mockDatabase.prisma.commandUsage.groupBy.mockResolvedValue([
        { _count: { id: 1 }, success: true },
        { _count: { id: 1 }, success: false },
      ]);
      mockDatabase.prisma.commandUsage.aggregate.mockResolvedValue({
        _avg: { executionTime: 250 },
      });

      await analyticsService.updateMetrics();

      expect(analyticsService.metrics.activeUsers).toBe(2);
      expect(analyticsService.metrics.totalCommands).toBe(2);
      expect(analyticsService.metrics.responseTime).toBe(250);
      expect(analyticsService.metrics.errorRate).toBe(50); // 1 error out of 2 total
    });

    test('should handle metrics update errors', async () => {
      mockDatabase.prisma.user.count.mockRejectedValue(new Error('Database error'));

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      await analyticsService.updateMetrics();

      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe('dashboard data', () => {
    beforeEach(async () => {
      await analyticsService.initialize({});
    });

    test('should get dashboard data successfully', async () => {
      const mockOverview = {
        totalUsers: 100,
        premiumUsers: 25,
        activeUsers: 50,
        totalCommands: 1000,
        aiRequests: 200,
        revenue: 2500,
      };

      const mockCommandStats = [
        { category: 'ai-chat', _count: { id: 200 } },
        { category: 'downloader', _count: { id: 150 } },
      ];

      mockDatabase.prisma.user.count.mockResolvedValue(100);
      mockDatabase.prisma.subscription.count.mockResolvedValue(25);
      mockDatabase.prisma.commandUsage.count
        .mockResolvedValueOnce(1000) // total commands
        .mockResolvedValueOnce(200); // ai requests
      mockDatabase.prisma.commandUsage.groupBy.mockResolvedValue(mockCommandStats);
      mockDatabase.prisma.payment.aggregate.mockResolvedValue({
        _sum: { amount: 2500 },
      });
      mockDatabase.prisma.commandUsage.findMany.mockResolvedValue([]);

      const result = await analyticsService.getDashboardData();

      expect(result.overview).toEqual(mockOverview);
      expect(result.commandStats).toEqual({
        'ai-chat': 200,
        'downloader': 150,
      });
    });

    test('should use cached data when available', async () => {
      const cachedData = { test: 'cached' };
      analyticsService.cache.set('dashboard_data', {
        data: cachedData,
        timestamp: Date.now(),
      });

      const result = await analyticsService.getDashboardData();

      expect(result).toEqual(cachedData);
      expect(mockDatabase.prisma.user.count).not.toHaveBeenCalled();
    });
  });

  describe('detailed metrics', () => {
    beforeEach(async () => {
      await analyticsService.initialize({});
    });

    test('should get metrics for 24h timeframe', async () => {
      const startDate = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const endDate = new Date();

      const mockUserGrowth = [
        { createdAt: new Date(), _count: { id: 10 } },
      ];

      const mockCommandUsage = [
        { usedAt: new Date(), _count: { id: 50 } },
      ];

      const mockRevenue = [
        { createdAt: new Date(), _sum: { amount: 500 } },
      ];

      mockDatabase.prisma.user.groupBy.mockResolvedValue(mockUserGrowth);
      mockDatabase.prisma.commandUsage.groupBy
        .mockResolvedValueOnce(mockCommandUsage)
        .mockResolvedValueOnce(mockRevenue)
        .mockResolvedValueOnce([]);

      const result = await analyticsService.getMetrics('24h');

      expect(result.timeframe).toBe('24h');
      expect(result.userGrowth).toHaveLength(1);
      expect(result.commandUsage).toHaveLength(1);
      expect(result.revenue).toHaveLength(1);
      expect(result.summary.totalUsers).toBe(10);
      expect(result.summary.totalCommands).toBe(50);
      expect(result.summary.totalRevenue).toBe(500);
    });

    test('should handle different timeframes', async () => {
      mockDatabase.prisma.user.groupBy.mockResolvedValue([]);
      mockDatabase.prisma.commandUsage.groupBy.mockResolvedValue([]);

      const result1h = await analyticsService.getMetrics('1h');
      const result7d = await analyticsService.getMetrics('7d');
      const result30d = await analyticsService.getMetrics('30d');

      expect(result1h.timeframe).toBe('1h');
      expect(result7d.timeframe).toBe('7d');
      expect(result30d.timeframe).toBe('30d');
    });
  });

  describe('event tracking', () => {
    beforeEach(async () => {
      await analyticsService.initialize({ websocketPort: 8080 });
    });

    test('should track user events', async () => {
      const eventData = {
        userId: 'user-123',
        event: 'command_used',
        properties: { command: '/help', success: true },
      };

      mockDatabase.prisma.analytics.create.mockResolvedValue({
        id: 'event-123',
        ...eventData,
        recordedAt: new Date(),
      });

      await analyticsService.trackEvent(
        eventData.userId,
        eventData.event,
        eventData.properties
      );

      expect(mockDatabase.prisma.analytics.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          metric: `event_${eventData.event}`,
          value: 1,
          category: 'behavior',
          metadata: JSON.stringify({
            userId: eventData.userId,
            event: eventData.event,
            ...eventData.properties,
          }),
        }),
      });
    });

    test('should broadcast events to WebSocket clients', async () => {
      const mockWs = {
        readyState: WebSocket.OPEN,
        send: jest.fn(),
      };

      analyticsService.clients.add(mockWs);

      await analyticsService.trackEvent('user-123', 'test_event');

      expect(mockWs.send).toHaveBeenCalledWith(
        JSON.stringify({
          type: 'event',
          data: expect.objectContaining({
            userId: 'user-123',
            event: 'test_event',
          }),
        })
      );
    });
  });

  describe('business intelligence reports', () => {
    beforeEach(async () => {
      await analyticsService.initialize({});
    });

    test('should generate user engagement report', async () => {
      const filters = {
        startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        endDate: new Date().toISOString(),
      };

      mockDatabase.prisma.user.groupBy.mockResolvedValue([
        { lastActivity: new Date(), _count: { id: 50 } },
      ]);
      mockDatabase.prisma.commandUsage.groupBy.mockResolvedValue([
        { userId: 'user-1', _count: { id: 100 } },
        { userId: 'user-2', _count: { id: 75 } },
      ]);
      mockDatabase.prisma.userSession.findMany.mockResolvedValue([
        { startedAt: new Date(), duration: 3600 },
      ]);

      const result = await analyticsService.generateBIReport('user_engagement', filters);

      expect(result.type).toBe('user_engagement');
      expect(result.data.dailyActiveUsers).toBeDefined();
      expect(result.data.topUsers).toBeDefined();
      expect(result.data.sessionStats).toBeDefined();
    });

    test('should generate revenue analysis report', async () => {
      const filters = {
        startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        endDate: new Date().toISOString(),
      };

      mockDatabase.prisma.payment.groupBy.mockResolvedValue([
        { userId: 'user-1', _sum: { amount: 999 } },
      ]);
      mockDatabase.prisma.subscription.aggregate.mockResolvedValue({
        _count: { id: 25 },
      });
      mockDatabase.prisma.subscription.findMany.mockResolvedValue([]);

      const result = await analyticsService.generateBIReport('revenue_analysis', filters);

      expect(result.type).toBe('revenue_analysis');
      expect(result.data.totalRevenue).toBe(999);
      expect(result.data.monthlyRecurringRevenue).toBe(25 * 9.99);
    });

    test('should handle unknown report types', async () => {
      await expect(
        analyticsService.generateBIReport('unknown_report')
      ).rejects.toThrow('Unknown report type: unknown_report');
    });
  });

  describe('cache management', () => {
    beforeEach(async () => {
      await analyticsService.initialize({});
    });

    test('should clean expired cache entries', () => {
      const now = Date.now();
      const expiredTimestamp = now - analyticsService.cacheTimeout - 1000;
      const validTimestamp = now - 1000;

      analyticsService.cache.set('expired', {
        data: 'expired',
        timestamp: expiredTimestamp,
      });
      analyticsService.cache.set('valid', {
        data: 'valid',
        timestamp: validTimestamp,
      });

      analyticsService.cleanCache();

      expect(analyticsService.cache.has('expired')).toBe(false);
      expect(analyticsService.cache.has('valid')).toBe(true);
    });
  });

  describe('health check', () => {
    test('should return healthy status', async () => {
      await analyticsService.initialize({ websocketPort: 8080 });

      const mockWs = { readyState: WebSocket.OPEN };
      analyticsService.clients.add(mockWs);

      const health = await analyticsService.healthCheck();

      expect(health.status).toBe('healthy');
      expect(health.service).toBe('analytics');
      expect(health.websocketClients).toBe(1);
      expect(health.cacheEntries).toBe(0);
    });

    test('should return unhealthy status on error', async () => {
      // Force an error by not initializing
      analyticsService.isInitialized = false;

      const health = await analyticsService.healthCheck();

      expect(health.status).toBe('unhealthy');
      expect(health.service).toBe('analytics');
    });
  });

  describe('cleanup', () => {
    test('should close WebSocket server', async () => {
      await analyticsService.initialize({ websocketPort: 8080 });

      analyticsService.close();

      expect(mockWss.close).toHaveBeenCalled();
    });
  });
});