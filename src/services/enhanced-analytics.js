import { logger } from '../utils/logger.js';
import { prisma } from '../services/database.js';

export class EnhancedAnalytics {
  constructor() {
    this.metrics = {
      totalConversations: 0,
      averageResponseTime: 0,
      userSatisfaction: 0,
      commandUsage: new Map(),
      dropoffPoints: new Map(),
    };
  }

  /**
   * Track conversation metrics
   */
  async trackConversation(userId, messageId, metrics) {
    try {
      await prisma.conversationAnalytics.create({
        data: {
          userId,
          messageId,
          responseTime: metrics.responseTime,
          aiConfidence: metrics.confidence || 0,
          userSatisfaction: metrics.satisfaction || 0,
          commandUsed: metrics.command,
          errorOccurred: metrics.error || false,
          dropoffPoint: metrics.dropoff,
          createdAt: new Date(),
        },
      });

      // Update in-memory metrics
      this.updateMetrics(metrics);

      logger.debug('Conversation metrics tracked', { userId, command: metrics.command });
    } catch (error) {
      logger.error('Failed to track conversation metrics', { error: error.message, userId });
    }
  }

  /**
   * Update in-memory metrics for real-time dashboard
   */
  updateMetrics(metrics) {
    this.metrics.totalConversations++;

    if (metrics.responseTime) {
      this.metrics.averageResponseTime =
        (this.metrics.averageResponseTime + metrics.responseTime) / 2;
    }

    if (metrics.satisfaction) {
      this.metrics.userSatisfaction = (this.metrics.userSatisfaction + metrics.satisfaction) / 2;
    }

    if (metrics.command) {
      const current = this.metrics.commandUsage.get(metrics.command) || 0;
      this.metrics.commandUsage.set(metrics.command, current + 1);
    }

    if (metrics.dropoff) {
      const current = this.metrics.dropoffPoints.get(metrics.dropoff) || 0;
      this.metrics.dropoffPoints.set(metrics.dropoff, current + 1);
    }
  }

  /**
   * Get conversation insights for dashboard
   */
  async getConversationInsights(timeframe = '7d') {
    try {
      const startDate = this.getStartDate(timeframe);

      // Top drop-off points
      const dropoffs = await prisma.conversationAnalytics.groupBy({
        by: ['dropoffPoint'],
        _count: true,
        where: {
          dropoffPoint: { not: null },
          createdAt: { gte: startDate },
        },
        orderBy: { _count: { dropoffPoint: 'desc' } },
        take: 10,
      });

      // Command performance
      const commandPerformance = await prisma.conversationAnalytics.groupBy({
        by: ['commandUsed'],
        _avg: { responseTime: true, userSatisfaction: true },
        _count: true,
        where: { createdAt: { gte: startDate } },
        orderBy: { _count: { commandUsed: 'desc' } },
        take: 20,
      });

      // User satisfaction trends
      const satisfactionTrend = await this.getSatisfactionTrend(startDate);

      // Error analysis
      const errorAnalysis = await prisma.conversationAnalytics.groupBy({
        by: ['commandUsed'],
        where: {
          errorOccurred: true,
          createdAt: { gte: startDate },
        },
        _count: true,
        orderBy: { _count: { commandUsed: 'desc' } },
        take: 10,
      });

      return {
        dropoffs: dropoffs.map(d => ({
          point: d.dropoffPoint,
          count: d._count,
        })),
        commandPerformance: commandPerformance.map(cp => ({
          command: cp.commandUsed,
          usage: cp._count,
          avgResponseTime: Math.round(cp._avg.responseTime || 0),
          avgSatisfaction: Math.round((cp._avg.userSatisfaction || 0) * 100) / 100,
        })),
        satisfactionTrend,
        errorAnalysis: errorAnalysis.map(ea => ({
          command: ea.commandUsed,
          errors: ea._count,
        })),
        timeframe,
        generatedAt: new Date().toISOString(),
      };
    } catch (error) {
      logger.error('Failed to get conversation insights', { error: error.message });
      return this.getFallbackInsights();
    }
  }

  /**
   * Get satisfaction trend over time
   */
  async getSatisfactionTrend(startDate) {
    try {
      const trend = await prisma.$queryRaw`
        SELECT
          DATE(created_at) as date,
          AVG(user_satisfaction) as avg_satisfaction,
          COUNT(*) as total_conversations
        FROM conversation_analytics
        WHERE created_at >= ${startDate}
        GROUP BY DATE(created_at)
        ORDER BY date ASC
      `;

      return trend.map(row => ({
        date: row.date.toISOString().split('T')[0],
        satisfaction: Math.round((parseFloat(row.avg_satisfaction) || 0) * 100) / 100,
        conversations: parseInt(row.total_conversations),
      }));
    } catch (error) {
      logger.error('Failed to get satisfaction trend', { error: error.message });
      return [];
    }
  }

  /**
   * Get user engagement metrics
   */
  async getUserEngagementMetrics(timeframe = '30d') {
    try {
      const startDate = this.getStartDate(timeframe);

      const metrics = await prisma.$queryRaw`
        SELECT
          COUNT(DISTINCT user_id) as active_users,
          COUNT(*) as total_messages,
          AVG(response_time) as avg_response_time,
          AVG(user_satisfaction) as avg_satisfaction,
          COUNT(CASE WHEN error_occurred = true THEN 1 END) as total_errors
        FROM conversation_analytics
        WHERE created_at >= ${startDate}
      `;

      const [result] = metrics;

      return {
        activeUsers: parseInt(result.active_users),
        totalMessages: parseInt(result.total_messages),
        avgResponseTime: Math.round(parseFloat(result.avg_response_time) || 0),
        avgSatisfaction: Math.round((parseFloat(result.avg_satisfaction) || 0) * 100) / 100,
        errorRate:
          result.total_messages > 0
            ? Math.round(
                (parseInt(result.total_errors) / parseInt(result.total_messages)) * 10000
              ) / 100
            : 0,
        timeframe,
        generatedAt: new Date().toISOString(),
      };
    } catch (error) {
      logger.error('Failed to get user engagement metrics', { error: error.message });
      return this.getFallbackEngagementMetrics();
    }
  }

  /**
   * Get real-time metrics for dashboard
   */
  getRealTimeMetrics() {
    return {
      ...this.metrics,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memoryUsage: process.memoryUsage(),
    };
  }

  /**
   * Helper: Get start date for timeframe
   */
  getStartDate(timeframe) {
    const now = new Date();
    const units = {
      '1h': 1 * 60 * 60 * 1000,
      '24h': 24 * 60 * 60 * 1000,
      '7d': 7 * 24 * 60 * 60 * 1000,
      '30d': 30 * 24 * 60 * 60 * 1000,
    };

    return new Date(now.getTime() - (units[timeframe] || units['7d']));
  }

  /**
   * Fallback insights when database is unavailable
   */
  getFallbackInsights() {
    return {
      dropoffs: [],
      commandPerformance: [],
      satisfactionTrend: [],
      errorAnalysis: [],
      timeframe: '7d',
      generatedAt: new Date().toISOString(),
      error: 'Database unavailable',
    };
  }

  /**
   * Fallback engagement metrics
   */
  getFallbackEngagementMetrics() {
    return {
      activeUsers: 0,
      totalMessages: 0,
      avgResponseTime: 0,
      avgSatisfaction: 0,
      errorRate: 0,
      timeframe: '30d',
      generatedAt: new Date().toISOString(),
      error: 'Database unavailable',
    };
  }

  /**
   * Clean up old analytics data (keep last 90 days)
   */
  async cleanupOldData() {
    try {
      const ninetyDaysAgo = new Date();
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

      const deleted = await prisma.conversationAnalytics.deleteMany({
        where: {
          createdAt: { lt: ninetyDaysAgo },
        },
      });

      logger.info('Cleaned up old analytics data', { deletedCount: deleted.count });
      return deleted.count;
    } catch (error) {
      logger.error('Failed to cleanup old analytics data', { error: error.message });
      return 0;
    }
  }
}

// Export singleton instance
export default new EnhancedAnalytics();
