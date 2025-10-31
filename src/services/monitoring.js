const { PrismaClient } = require('@prisma/client');
const logger = require('../utils/logger');

class MonitoringService {
  constructor() {
    this.prisma = new PrismaClient();
    this.metrics = {
      responseTimes: [],
      errorCounts: new Map(),
      commandUsage: new Map(),
      activeConnections: 0,
      memoryUsage: 0,
      cacheHitRate: 0,
    };

    // Start periodic cleanup and aggregation
    this.startPeriodicTasks();
  }

  /**
   * Record API response time
   * @param {string} endpoint - API endpoint
   * @param {number} responseTime - Response time in milliseconds
   * @param {number} statusCode - HTTP status code
   */
  async recordResponseTime(endpoint, responseTime, statusCode) {
    try {
      // Store in database for long-term analysis
      await this.prisma.analytics.create({
        data: {
          metric: 'response_time',
          value: responseTime,
          category: 'api',
          metadata: JSON.stringify({ endpoint, statusCode }),
        },
      });

      // Keep in-memory metrics for quick access
      this.metrics.responseTimes.push({
        endpoint,
        responseTime,
        statusCode,
        timestamp: Date.now(),
      });

      // Keep only last 1000 entries
      if (this.metrics.responseTimes.length > 1000) {
        this.metrics.responseTimes = this.metrics.responseTimes.slice(-1000);
      }

      // Log slow requests
      if (responseTime > 1000) {
        logger.warn('Slow API response', {
          endpoint,
          responseTime,
          statusCode,
        });
      }
    } catch (error) {
      logger.error('Failed to record response time:', error);
    }
  }

  /**
   * Record command usage
   * @param {string} command - Command name
   * @param {string} userId - User ID
   * @param {boolean} success - Whether command succeeded
   * @param {number} executionTime - Execution time in milliseconds
   */
  async recordCommandUsage(command, userId, success = true, executionTime = null) {
    try {
      // Store in database
      await this.prisma.commandUsage.create({
        data: {
          userId,
          command,
          category: this.categorizeCommand(command),
          success,
          executionTime,
          errorMessage: success ? null : 'Command failed',
        },
      });

      // Update in-memory counters
      const key = `${command}:${success ? 'success' : 'error'}`;
      this.metrics.commandUsage.set(key, (this.metrics.commandUsage.get(key) || 0) + 1);

      // Log command metrics
      logger.info('Command executed', {
        command,
        userId,
        success,
        executionTime,
      });
    } catch (error) {
      logger.error('Failed to record command usage:', error);
    }
  }

  /**
   * Record error
   * @param {Error} error - Error object
   * @param {Object} context - Additional context
   */
  async recordError(error, context = {}) {
    try {
      const errorKey = error.name || 'UnknownError';
      this.metrics.errorCounts.set(errorKey, (this.metrics.errorCounts.get(errorKey) || 0) + 1);

      // Store in database
      await this.prisma.errorLog.create({
        data: {
          level: 'error',
          message: error.message,
          stack: error.stack,
          userId: context.userId,
          command: context.command,
          metadata: JSON.stringify(context),
        },
      });

      // Log critical errors
      if (this.isCriticalError(error)) {
        logger.error('Critical error recorded', {
          error: error.message,
          stack: error.stack,
          context,
        });
      }
    } catch (dbError) {
      logger.error('Failed to record error:', dbError);
    }
  }

  /**
   * Record audit event
   * @param {Object} event - Audit event data
   */
  async recordAuditEvent(event) {
    try {
      await this.prisma.auditLog.create({
        data: {
          eventType: event.eventType,
          actor: event.actor,
          actorId: event.actorId,
          action: event.action,
          resource: event.resource,
          resourceId: event.resourceId,
          details: event.details ? JSON.stringify(event.details) : null,
          riskLevel: event.riskLevel || 'low',
          ipAddress: event.ipAddress,
          userAgent: event.userAgent,
          sessionId: event.sessionId,
          location: event.location,
          metadata: event.metadata ? JSON.stringify(event.metadata) : null,
        },
      });

      // Log high-risk events immediately
      if (event.riskLevel === 'high' || event.riskLevel === 'critical') {
        logger.warn('High-risk audit event', event);
      }
    } catch (error) {
      logger.error('Failed to record audit event:', error);
    }
  }

  /**
   * Update system metrics
   * @param {Object} systemMetrics - System metrics
   */
  updateSystemMetrics(systemMetrics) {
    this.metrics.memoryUsage = systemMetrics.memoryUsage || 0;
    this.metrics.cacheHitRate = systemMetrics.cacheHitRate || 0;
    this.metrics.activeConnections = systemMetrics.activeConnections || 0;
  }

  /**
   * Get current metrics summary
   * @returns {Object} Metrics summary
   */
  getMetricsSummary() {
    const now = Date.now();
    const lastHour = now - 60 * 60 * 1000;

    // Calculate response time stats from last hour
    const recentResponses = this.metrics.responseTimes.filter(r => r.timestamp > lastHour);
    const avgResponseTime =
      recentResponses.length > 0
        ? recentResponses.reduce((sum, r) => sum + r.responseTime, 0) / recentResponses.length
        : 0;

    // Calculate error rate
    const totalCommands = Array.from(this.metrics.commandUsage.values()).reduce((a, b) => a + b, 0);
    const errorCommands = Array.from(this.metrics.commandUsage.entries())
      .filter(([key]) => key.endsWith(':error'))
      .reduce((sum, [, count]) => sum + count, 0);
    const errorRate = totalCommands > 0 ? (errorCommands / totalCommands) * 100 : 0;

    return {
      activeUsers: this.metrics.activeConnections,
      avgResponseTime: Math.round(avgResponseTime),
      errorRate: parseFloat(errorRate.toFixed(2)),
      memoryUsage: this.metrics.memoryUsage,
      cacheHitRate: this.metrics.cacheHitRate,
      totalCommands,
      recentResponses: recentResponses.length,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Get detailed analytics
   * @param {string} timeRange - Time range (1h, 24h, 7d)
   * @returns {Object} Detailed analytics
   */
  async getDetailedAnalytics(timeRange = '24h') {
    try {
      const hours = this.parseTimeRange(timeRange);
      const since = new Date(Date.now() - hours * 60 * 60 * 1000);

      const [responseTimes, commandStats, errorStats] = await Promise.all([
        this.prisma.analytics.findMany({
          where: {
            recordedAt: { gte: since },
            metric: 'response_time',
          },
          orderBy: { recordedAt: 'desc' },
        }),
        this.prisma.commandUsage.groupBy({
          by: ['command', 'success'],
          where: { usedAt: { gte: since } },
          _count: true,
        }),
        this.prisma.errorLog.findMany({
          where: { createdAt: { gte: since } },
          select: { level: true, message: true, createdAt: true },
        }),
      ]);

      return {
        responseTimes: responseTimes.map(rt => ({
          value: rt.value,
          timestamp: rt.recordedAt,
          metadata: JSON.parse(rt.metadata || '{}'),
        })),
        commandStats,
        errorStats,
        timeRange,
      };
    } catch (error) {
      logger.error('Failed to get detailed analytics:', error);
      return { error: error.message };
    }
  }

  /**
   * Health check
   * @returns {Object} Health status
   */
  async healthCheck() {
    try {
      // Check database connectivity
      await this.prisma.$queryRaw`SELECT 1`;

      const metrics = this.getMetricsSummary();

      return {
        status: 'healthy',
        database: 'connected',
        metrics,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        database: 'disconnected',
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Start periodic cleanup tasks
   */
  startPeriodicTasks() {
    // Clean up old in-memory metrics every hour
    setInterval(
      () => {
        const oneHourAgo = Date.now() - 60 * 60 * 1000;
        this.metrics.responseTimes = this.metrics.responseTimes.filter(
          r => r.timestamp > oneHourAgo
        );
      },
      60 * 60 * 1000
    ); // Every hour

    // Aggregate and archive old data daily
    setInterval(
      async () => {
        try {
          await this.archiveOldData();
        } catch (error) {
          logger.error('Failed to archive old data:', error);
        }
      },
      24 * 60 * 60 * 1000
    ); // Daily
  }

  /**
   * Archive old analytics data
   */
  async archiveOldData() {
    try {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

      // Archive old analytics data (keep last 30 days in main table)
      const oldAnalyticsCount = await this.prisma.analytics.deleteMany({
        where: {
          recordedAt: { lt: thirtyDaysAgo },
        },
      });

      // Archive old command usage (keep last 90 days)
      const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
      const oldCommandCount = await this.prisma.commandUsage.deleteMany({
        where: {
          usedAt: { lt: ninetyDaysAgo },
        },
      });

      logger.info('Archived old monitoring data', {
        analyticsDeleted: oldAnalyticsCount.count,
        commandsDeleted: oldCommandCount.count,
      });
    } catch (error) {
      logger.error('Failed to archive old data:', error);
    }
  }

  /**
   * Categorize command based on name
   * @param {string} command - Command name
   * @returns {string} Category
   */
  categorizeCommand(command) {
    const categories = {
      ai: ['ai', 'chat', 'ask', 'gpt', 'gemini'],
      media: ['sticker', 'image', 'video', 'audio', 'download'],
      games: ['game', 'quiz', 'play', 'suit'],
      utility: ['ping', 'help', 'menu', 'info'],
      social: ['menfes', 'confess', 'profile'],
      admin: ['ban', 'kick', 'promote', 'demote'],
    };

    for (const [category, keywords] of Object.entries(categories)) {
      if (keywords.some(keyword => command.toLowerCase().includes(keyword))) {
        return category;
      }
    }

    return 'misc';
  }

  /**
   * Check if error is critical
   * @param {Error} error - Error object
   * @returns {boolean} Whether error is critical
   */
  isCriticalError(error) {
    const criticalErrors = ['DatabaseError', 'ConnectionError', 'AuthenticationError'];
    return (
      criticalErrors.includes(error.name) ||
      error.message.toLowerCase().includes('critical') ||
      error.message.toLowerCase().includes('fatal')
    );
  }

  /**
   * Parse time range string
   * @param {string} timeRange - Time range string
   * @returns {number} Hours
   */
  parseTimeRange(timeRange) {
    const ranges = {
      '1h': 1,
      '24h': 24,
      '7d': 168,
      '30d': 720,
    };
    return ranges[timeRange] || 24;
  }

  /**
   * Close database connection
   */
  async close() {
    await this.prisma.$disconnect();
  }
}

module.exports = MonitoringService;
