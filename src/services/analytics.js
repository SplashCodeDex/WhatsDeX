import WebSocket from 'ws';
import logger from '../utils/logger.js';

class AnalyticsService {
  constructor(databaseService) {
    this.database = databaseService;
    this.wss = null;
    this.clients = new Set();
    this.isInitialized = false;

    // Analytics cache for performance
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes

    // Real-time metrics
    this.metrics = {
      activeUsers: 0,
      totalCommands: 0,
      aiRequests: 0,
      responseTime: 0,
      errorRate: 0,
      uptime: 0,
    };

    logger.info('Analytics service initialized');
  }

  /**
   * Initialize analytics service
   * @param {Object} config - Configuration object
   */
  async initialize(config) {
    try {
      // Initialize WebSocket server for real-time updates
      if (config.websocketPort) {
        this.wss = new WebSocket.Server({ port: config.websocketPort });

        this.wss.on('connection', async ws => {
          this.clients.add(ws);

          ws.on('message', message => {
            this.handleWebSocketMessage(ws, message);
          });

          ws.on('close', () => {
            this.clients.delete(ws);
          });

          // Send initial data
          this.sendToClient(ws, {
            type: 'welcome',
            data: await this.getDashboardData(),
          });
        });

        logger.info(`WebSocket server started on port ${config.websocketPort}`);
      }

      // Start metrics collection
      this.startMetricsCollection();

      this.isInitialized = true;
      logger.info('Analytics service initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize analytics service', { error: error.message });
      throw error;
    }
  }

  /**
   * Handle WebSocket messages
   * @param {WebSocket} ws - WebSocket connection
   * @param {string} message - Message data
   */
  async handleWebSocketMessage(ws, message) {
    try {
      const data = JSON.parse(message.toString());

      switch (data.type) {
        case 'subscribe':
          // Client wants to subscribe to real-time updates
          this.sendToClient(ws, {
            type: 'subscribed',
            data: { message: 'Successfully subscribed to real-time updates' },
          });
          break;

        case 'get_metrics':
          const metrics = await this.getMetrics(data.timeframe || '24h');
          this.sendToClient(ws, {
            type: 'metrics',
            data: metrics,
          });
          break;

        case 'get_dashboard':
          const dashboard = await this.getDashboardData();
          this.sendToClient(ws, {
            type: 'dashboard',
            data: dashboard,
          });
          break;

        default:
          logger.warn('Unknown WebSocket message type', { type: data.type });
      }
    } catch (error) {
      logger.error('Failed to handle WebSocket message', { error: error.message });
      this.sendToClient(ws, {
        type: 'error',
        data: { message: 'Failed to process message' },
      });
    }
  }

  /**
   * Send data to a specific WebSocket client
   * @param {WebSocket} ws - WebSocket connection
   * @param {Object} data - Data to send
   */
  sendToClient(ws, data) {
    try {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(data));
      }
    } catch (error) {
      logger.error('Failed to send data to WebSocket client', { error: error.message });
    }
  }

  /**
   * Broadcast data to all connected clients
   * @param {Object} data - Data to broadcast
   */
  broadcast(data) {
    try {
      const message = JSON.stringify(data);
      this.clients.forEach(ws => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(message);
        }
      });
    } catch (error) {
      logger.error('Failed to broadcast data', { error: error.message });
    }
  }

  /**
   * Start metrics collection interval
   */
  startMetricsCollection() {
    // Update metrics every 30 seconds
    setInterval(async () => {
      try {
        await this.updateMetrics();
        const dashboardData = await this.getDashboardData();

        // Broadcast updated data to all clients
        this.broadcast({
          type: 'dashboard_update',
          data: dashboardData,
          timestamp: new Date().toISOString(),
        });
      } catch (error) {
        logger.error('Failed to update metrics', { error: error.message });
      }
    }, 30000);

    // Clean cache every 10 minutes
    setInterval(
      () => {
        this.cleanCache();
      },
      10 * 60 * 1000
    );

    logger.info('Metrics collection started');
  }

  /**
   * Update real-time metrics
   */
  async updateMetrics() {
    try {
      const now = new Date();
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      // Active users (users active in last hour)
      const activeUsers = await this.database.prisma.user.count({
        where: {
          lastActivity: {
            gte: oneHourAgo,
          },
        },
      });

      // Total commands in last 24 hours
      const totalCommands = await this.database.prisma.commandUsage.count({
        where: {
          usedAt: {
            gte: oneDayAgo,
          },
        },
      });

      // AI requests in last 24 hours
      const aiRequests = await this.database.prisma.commandUsage.count({
        where: {
          usedAt: {
            gte: oneDayAgo,
          },
          category: 'ai-chat',
        },
      });

      // Average response time
      const responseTimeData = await this.database.prisma.commandUsage.aggregate({
        where: {
          usedAt: {
            gte: oneDayAgo,
          },
          executionTime: {
            not: null,
          },
        },
        _avg: {
          executionTime: true,
        },
      });

      // Error rate
      const totalUsage = await this.database.prisma.commandUsage.count({
        where: {
          usedAt: {
            gte: oneDayAgo,
          },
        },
      });

      const errorCount = await this.database.prisma.commandUsage.count({
        where: {
          usedAt: {
            gte: oneDayAgo,
          },
          success: false,
        },
      });

      // Update metrics
      this.metrics = {
        activeUsers,
        totalCommands,
        aiRequests,
        responseTime: responseTimeData._avg.executionTime || 0,
        errorRate: totalUsage > 0 ? (errorCount / totalUsage) * 100 : 0,
        uptime: process.uptime(),
        timestamp: now.toISOString(),
      };

      logger.debug('Metrics updated', this.metrics);
    } catch (error) {
      logger.error('Failed to update metrics', { error: error.message });
    }
  }

  /**
   * Get dashboard data
   * @returns {Promise<Object>} Dashboard data
   */
  async getDashboardData() {
    try {
      const cacheKey = 'dashboard_data';
      const cached = this.cache.get(cacheKey);

      if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
        return cached.data;
      }

      const now = new Date();
      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      // User statistics
      const totalUsers = await this.database.prisma.user.count();
      const premiumUsers = await this.database.prisma.subscription.count({
        where: {
          status: 'active',
        },
      });

      // Command statistics
      const commandStats = await this.database.prisma.commandUsage.groupBy({
        by: ['category'],
        where: {
          usedAt: {
            gte: oneDayAgo,
          },
        },
        _count: {
          id: true,
        },
      });

      // Revenue statistics
      const revenueData = await this.database.prisma.payment.aggregate({
        where: {
          status: 'completed',
          createdAt: {
            gte: sevenDaysAgo,
          },
        },
        _sum: {
          amount: true,
        },
      });

      // Recent activity
      const recentActivity = await this.database.prisma.commandUsage.findMany({
        take: 10,
        orderBy: {
          usedAt: 'desc',
        },
        include: {
          user: {
            select: {
              name: true,
            },
          },
        },
      });

      // System health
      const systemHealth = {
        database: await this.database.healthCheck(),
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        cpu: process.cpuUsage(),
      };

      const dashboardData = {
        overview: {
          totalUsers,
          premiumUsers,
          activeUsers: this.metrics.activeUsers,
          totalCommands: this.metrics.totalCommands,
          aiRequests: this.metrics.aiRequests,
          revenue: revenueData._sum.amount || 0,
        },
        performance: {
          responseTime: this.metrics.responseTime,
          errorRate: this.metrics.errorRate,
          uptime: this.metrics.uptime,
        },
        commandStats: commandStats.reduce((acc, stat) => {
          acc[stat.category] = stat._count.id;
          return acc;
        }, {}),
        recentActivity: recentActivity.map(activity => ({
          id: activity.id,
          user: activity.user.name || 'Unknown',
          command: activity.command,
          category: activity.category,
          success: activity.success,
          timestamp: activity.usedAt,
        })),
        systemHealth,
        timestamp: now.toISOString(),
      };

      // Cache the data
      this.cache.set(cacheKey, {
        data: dashboardData,
        timestamp: Date.now(),
      });

      return dashboardData;
    } catch (error) {
      logger.error('Failed to get dashboard data', { error: error.message });
      throw error;
    }
  }

  /**
   * Get detailed metrics for a timeframe
   * @param {string} timeframe - Timeframe (1h, 24h, 7d, 30d)
   * @returns {Promise<Object>} Detailed metrics
   */
  async getMetrics(timeframe = '24h') {
    try {
      const now = new Date();
      let startDate;

      switch (timeframe) {
        case '1h':
          startDate = new Date(now.getTime() - 60 * 60 * 1000);
          break;
        case '24h':
          startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
          break;
        case '7d':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case '30d':
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        default:
          startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      }

      // User growth
      const userGrowth = await this.database.prisma.user.groupBy({
        by: ['createdAt'],
        where: {
          createdAt: {
            gte: startDate,
          },
        },
        _count: {
          id: true,
        },
        orderBy: {
          createdAt: 'asc',
        },
      });

      // Command usage over time
      const commandUsage = await this.database.prisma.commandUsage.groupBy({
        by: ['usedAt'],
        where: {
          usedAt: {
            gte: startDate,
          },
        },
        _count: {
          id: true,
        },
        orderBy: {
          usedAt: 'asc',
        },
      });

      // Revenue over time
      const revenueOverTime = await this.database.prisma.payment.groupBy({
        by: ['createdAt'],
        where: {
          createdAt: {
            gte: startDate,
          },
          status: 'completed',
        },
        _sum: {
          amount: true,
        },
        orderBy: {
          createdAt: 'asc',
        },
      });

      // Error rate over time
      const errorRate = await this.database.prisma.commandUsage.groupBy({
        by: ['usedAt'],
        where: {
          usedAt: {
            gte: startDate,
          },
        },
        _count: {
          id: true,
          success: true,
        },
        orderBy: {
          usedAt: 'asc',
        },
      });

      return {
        timeframe,
        userGrowth: userGrowth.map(item => ({
          date: item.createdAt.toISOString().split('T')[0],
          count: item._count.id,
        })),
        commandUsage: commandUsage.map(item => ({
          timestamp: item.usedAt.toISOString(),
          count: item._count.id,
        })),
        revenue: revenueOverTime.map(item => ({
          date: item.createdAt.toISOString().split('T')[0],
          amount: item._sum.amount || 0,
        })),
        errorRate: errorRate.map(item => ({
          timestamp: item.usedAt.toISOString(),
          total: item._count.id,
          errors: item._count.id - (item._count.success || 0),
          rate:
            item._count.id > 0
              ? ((item._count.id - (item._count.success || 0)) / item._count.id) * 100
              : 0,
        })),
        summary: {
          totalUsers: userGrowth.reduce((sum, item) => sum + item._count.id, 0),
          totalCommands: commandUsage.reduce((sum, item) => sum + item._count.id, 0),
          totalRevenue: revenueOverTime.reduce((sum, item) => sum + (item._sum.amount || 0), 0),
          averageErrorRate:
            errorRate.length > 0
              ? errorRate.reduce(
                  (sum, item) =>
                    sum +
                    (item._count.id > 0
                      ? ((item._count.id - (item._count.success || 0)) / item._count.id) * 100
                      : 0),
                  0
                ) / errorRate.length
              : 0,
        },
      };
    } catch (error) {
      logger.error('Failed to get detailed metrics', {
        timeframe,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Track user behavior event
   * @param {string} userId - User ID
   * @param {string} event - Event name
   * @param {Object} properties - Event properties
   */
  async trackEvent(userId, event, properties = {}) {
    try {
      await this.database.prisma.analytics.create({
        data: {
          metric: `event_${event}`,
          value: 1,
          category: 'behavior',
          metadata: JSON.stringify({
            userId,
            event,
            ...properties,
          }),
          recordedAt: new Date(),
        },
      });

      // Broadcast event to WebSocket clients
      this.broadcast({
        type: 'event',
        data: {
          userId,
          event,
          properties,
          timestamp: new Date().toISOString(),
        },
      });

      logger.debug('Event tracked', { userId, event, properties });
    } catch (error) {
      logger.error('Failed to track event', {
        userId,
        event,
        error: error.message,
      });
    }
  }

  /**
   * Generate business intelligence report
   * @param {string} reportType - Type of report
   * @param {Object} filters - Report filters
   * @returns {Promise<Object>} Business intelligence report
   */
  async generateBIReport(reportType, filters = {}) {
    try {
      const report = {
        type: reportType,
        generatedAt: new Date().toISOString(),
        filters,
        data: {},
      };

      switch (reportType) {
        case 'user_engagement':
          report.data = await this.generateUserEngagementReport(filters);
          break;

        case 'revenue_analysis':
          report.data = await this.generateRevenueAnalysisReport(filters);
          break;

        case 'feature_usage':
          report.data = await this.generateFeatureUsageReport(filters);
          break;

        case 'performance_metrics':
          report.data = await this.generatePerformanceMetricsReport(filters);
          break;

        default:
          throw new Error(`Unknown report type: ${reportType}`);
      }

      // Cache the report
      const cacheKey = `bi_report_${reportType}_${JSON.stringify(filters)}`;
      this.cache.set(cacheKey, {
        data: report,
        timestamp: Date.now(),
      });

      return report;
    } catch (error) {
      logger.error('Failed to generate BI report', {
        reportType,
        filters,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Generate user engagement report
   * @param {Object} filters - Report filters
   * @returns {Promise<Object>} User engagement data
   */
  async generateUserEngagementReport(filters) {
    const startDate = filters.startDate
      ? new Date(filters.startDate)
      : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const endDate = filters.endDate ? new Date(filters.endDate) : new Date();

    // Daily active users
    const dau = await this.database.prisma.user.groupBy({
      by: ['lastActivity'],
      where: {
        lastActivity: {
          gte: startDate,
          lte: endDate,
        },
      },
      _count: {
        id: true,
      },
    });

    // Command usage by user
    const topUsers = await this.database.prisma.commandUsage.groupBy({
      by: ['userId'],
      where: {
        usedAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      _count: {
        id: true,
      },
      orderBy: {
        _count: {
          id: 'desc',
        },
      },
      take: 10,
    });

    // Session duration analysis
    const sessionData = await this.database.prisma.userSession.findMany({
      where: {
        startedAt: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    return {
      period: { startDate, endDate },
      dailyActiveUsers: dau.map(item => ({
        date: item.lastActivity.toISOString().split('T')[0],
        count: item._count.id,
      })),
      topUsers: await Promise.all(
        topUsers.map(async user => {
          const userData = await this.database.prisma.user.findUnique({
            where: { id: user.userId },
            select: { name: true },
          });
          return {
            userId: user.userId,
            name: userData?.name || 'Unknown',
            commandCount: user._count.id,
          };
        })
      ),
      sessionStats: {
        totalSessions: sessionData.length,
        averageDuration:
          sessionData.length > 0
            ? sessionData.reduce((sum, session) => sum + (session.duration || 0), 0) /
              sessionData.length
            : 0,
        totalDuration: sessionData.reduce((sum, session) => sum + (session.duration || 0), 0),
      },
    };
  }

  /**
   * Generate revenue analysis report
   * @param {Object} filters - Report filters
   * @returns {Promise<Object>} Revenue analysis data
   */
  async generateRevenueAnalysisReport(filters) {
    const startDate = filters.startDate
      ? new Date(filters.startDate)
      : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const endDate = filters.endDate ? new Date(filters.endDate) : new Date();

    // Revenue by plan
    const revenueByPlan = await this.database.prisma.payment.groupBy({
      by: ['userId'],
      where: {
        status: 'completed',
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      _sum: {
        amount: true,
      },
    });

    // Monthly recurring revenue
    const mrr = await this.database.prisma.subscription.aggregate({
      where: {
        status: 'active',
        createdAt: {
          lte: endDate,
        },
      },
      _count: {
        id: true,
      },
    });

    // Churn rate
    const churnData = await this.database.prisma.subscription.findMany({
      where: {
        status: 'canceled',
        cancelledAt: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    return {
      period: { startDate, endDate },
      totalRevenue: revenueByPlan.reduce((sum, item) => sum + (item._sum.amount || 0), 0),
      monthlyRecurringRevenue: mrr._count.id * 9.99, // Assuming average plan price
      revenueByPlan: await Promise.all(
        revenueByPlan.map(async item => {
          const subscription = await this.database.prisma.subscription.findFirst({
            where: { userId: item.userId },
            select: { planKey: true },
          });
          return {
            plan: subscription?.planKey || 'unknown',
            revenue: item._sum.amount || 0,
          };
        })
      ),
      churnRate: churnData.length,
      averageRevenuePerUser:
        revenueByPlan.length > 0
          ? revenueByPlan.reduce((sum, item) => sum + (item._sum.amount || 0), 0) /
            revenueByPlan.length
          : 0,
    };
  }

  /**
   * Generate feature usage report
   * @param {Object} filters - Report filters
   * @returns {Promise<Object>} Feature usage data
   */
  async generateFeatureUsageReport(filters) {
    const startDate = filters.startDate
      ? new Date(filters.startDate)
      : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const endDate = filters.endDate ? new Date(filters.endDate) : new Date();

    // Command usage by category
    const commandUsage = await this.database.prisma.commandUsage.groupBy({
      by: ['category', 'command'],
      where: {
        usedAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      _count: {
        id: true,
      },
      _avg: {
        executionTime: true,
      },
    });

    // AI feature usage
    const aiUsage = await this.database.prisma.commandUsage.groupBy({
      by: ['command'],
      where: {
        usedAt: {
          gte: startDate,
          lte: endDate,
        },
        category: {
          in: ['ai-chat', 'ai-image', 'ai-video', 'ai-misc'],
        },
      },
      _count: {
        id: true,
      },
    });

    return {
      period: { startDate, endDate },
      commandUsage: commandUsage.map(item => ({
        category: item.category,
        command: item.command,
        usage: item._count.id,
        averageResponseTime: item._avg.executionTime || 0,
      })),
      aiUsage: aiUsage.map(item => ({
        feature: item.command,
        usage: item._count.id,
      })),
      topCommands: commandUsage
        .sort((a, b) => b._count.id - a._count.id)
        .slice(0, 10)
        .map(item => ({
          command: item.command,
          category: item.category,
          usage: item._count.id,
        })),
    };
  }

  /**
   * Generate performance metrics report
   * @param {Object} filters - Report filters
   * @returns {Promise<Object>} Performance metrics data
   */
  async generatePerformanceMetricsReport(filters) {
    const startDate = filters.startDate
      ? new Date(filters.startDate)
      : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const endDate = filters.endDate ? new Date(filters.endDate) : new Date();

    // Response time trends
    const responseTimeData = await this.database.prisma.commandUsage.findMany({
      where: {
        usedAt: {
          gte: startDate,
          lte: endDate,
        },
        executionTime: {
          not: null,
        },
      },
      select: {
        executionTime: true,
        usedAt: true,
        success: true,
      },
      orderBy: {
        usedAt: 'asc',
      },
    });

    // Error rate trends
    const errorData = await this.database.prisma.commandUsage.groupBy({
      by: ['usedAt'],
      where: {
        usedAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      _count: {
        id: true,
        success: true,
      },
      orderBy: {
        usedAt: 'asc',
      },
    });

    return {
      period: { startDate, endDate },
      responseTime: {
        average:
          responseTimeData.length > 0
            ? responseTimeData.reduce((sum, item) => sum + item.executionTime, 0) /
              responseTimeData.length
            : 0,
        p95: this.calculatePercentile(
          responseTimeData.map(item => item.executionTime),
          95
        ),
        p99: this.calculatePercentile(
          responseTimeData.map(item => item.executionTime),
          99
        ),
        trend: responseTimeData.slice(-10).map(item => ({
          timestamp: item.usedAt.toISOString(),
          value: item.executionTime,
        })),
      },
      errorRate: {
        overall:
          errorData.length > 0
            ? (errorData.reduce(
                (sum, item) => sum + (item._count.id - (item._count.success || 0)),
                0
              ) /
                errorData.reduce((sum, item) => sum + item._count.id, 0)) *
              100
            : 0,
        trend: errorData.map(item => ({
          timestamp: item.usedAt.toISOString(),
          rate:
            item._count.id > 0
              ? ((item._count.id - (item._count.success || 0)) / item._count.id) * 100
              : 0,
        })),
      },
      uptime: process.uptime(),
      memoryUsage: process.memoryUsage(),
      throughput: responseTimeData.length / ((endDate - startDate) / (1000 * 60 * 60 * 24)), // requests per day
    };
  }

  /**
   * Calculate percentile from array
   * @param {Array<number>} arr - Array of numbers
   * @param {number} p - Percentile (0-100)
   * @returns {number} Percentile value
   */
  calculatePercentile(arr, p) {
    if (arr.length === 0) return 0;
    const sorted = arr.sort((a, b) => a - b);
    const index = (p / 100) * (sorted.length - 1);
    const lower = Math.floor(index);
    const upper = Math.ceil(index);
    const weight = index % 1;

    if (upper >= sorted.length) return sorted[sorted.length - 1];
    return sorted[lower] * (1 - weight) + sorted[upper] * weight;
  }

  /**
   * Clean expired cache entries
   */
  cleanCache() {
    const now = Date.now();
    for (const [key, value] of this.cache.entries()) {
      if (now - value.timestamp > this.cacheTimeout) {
        this.cache.delete(key);
      }
    }
    logger.debug('Cache cleaned', { entriesRemoved: this.cache.size });
  }

  /**
   * Check if service is initialized
   * @returns {boolean} Initialization status
   */
  isReady() {
    return this.isInitialized;
  }

  /**
   * Health check for analytics service
   * @returns {Promise<Object>} Health status
   */
  async healthCheck() {
    try {
      const clientCount = this.clients.size;
      const cacheSize = this.cache.size;

      return {
        status: 'healthy',
        service: 'analytics',
        initialized: this.isInitialized,
        websocketClients: clientCount,
        cacheEntries: cacheSize,
        metrics: this.metrics,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      logger.error('Analytics health check failed', { error: error.message });
      return {
        status: 'unhealthy',
        service: 'analytics',
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Close WebSocket server
   */
  close() {
    if (this.wss) {
      this.wss.close();
      logger.info('WebSocket server closed');
    }
  }
}

export default AnalyticsService;
