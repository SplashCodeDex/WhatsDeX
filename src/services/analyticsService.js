const context = require('../../context');

class AnalyticsService {
  constructor() {
    // Real analytics service using Prisma database
  }

  async getSystemOverview(dateFilters = {}) {
    try {
      const { startDate, endDate } = dateFilters;
      const dateFilter =
        startDate && endDate
          ? {
              createdAt: {
                gte: new Date(startDate),
                lte: new Date(endDate),
              },
            }
          : {};

      // Get user statistics
      const totalUsers = await context.database.user.count();
      const activeUsers = await context.database.user.count({
        where: {
          lastActiveAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Active in last 24 hours
          },
        },
      });
      const premiumUsers = await context.database.user.count({
        where: { isPremium: true },
      });

      // Get command statistics
      const totalCommands = await context.database.commandLog.count(dateFilter);

      // Get AI usage statistics
      const aiRequests = await context.database.aiRequestLog.count(dateFilter);
      const successfulAIRequests = await context.database.aiRequestLog.count({
        where: {
          ...dateFilter,
          success: true,
        },
      });

      // Get revenue statistics
      const revenueResult = await context.database.subscription.aggregate({
        _sum: { amount: true },
        where: dateFilter,
      });
      const totalRevenue = revenueResult._sum.amount || 0;

      // Get moderation statistics
      const moderationActions = await context.database.moderationLog.count(dateFilter);

      // Calculate growth metrics (compare with previous period)
      const periodLength =
        startDate && endDate ? new Date(endDate) - new Date(startDate) : 30 * 24 * 60 * 60 * 1000; // 30 days default

      const previousStart = new Date(
        (startDate ? new Date(startDate) : new Date(Date.now() - periodLength)).getTime() -
          periodLength
      );
      const previousEnd = startDate ? new Date(startDate) : new Date();

      const previousCommands = await context.database.commandLog.count({
        where: {
          createdAt: {
            gte: previousStart,
            lte: previousEnd,
          },
        },
      });

      const previousRevenue = await context.database.subscription.aggregate({
        _sum: { amount: true },
        where: {
          createdAt: {
            gte: previousStart,
            lte: previousEnd,
          },
        },
      });

      return {
        summary: {
          totalUsers,
          activeUsers,
          totalCommands,
          totalRevenue,
          aiRequests,
          moderationActions,
        },
        growth: {
          userGrowth: { daily: 0, weekly: 0, monthly: 0 }, // Would need historical data
          revenueGrowth: {
            daily: 0,
            weekly: 0,
            monthly:
              totalCommands > 0 ? ((totalCommands - previousCommands) / previousCommands) * 100 : 0,
          },
        },
        health: {
          uptime: 99.9, // Would need monitoring system
          errorRate: 0.1, // Would need error tracking
          averageResponseTime: 250, // Would need performance monitoring
        },
        comparison: {
          totalConnectionsChange:
            previousCommands > 0
              ? ((totalCommands - previousCommands) / previousCommands) * 100
              : 0,
          successRateChange: aiRequests > 0 ? (successfulAIRequests / aiRequests) * 100 - 95 : 0,
          averageConnectionTimeChange: 0, // Would need historical timing data
        },
        timeRange: {
          startDate: dateFilters.startDate,
          endDate: dateFilters.endDate,
        },
        lastUpdated: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Error getting system overview:', error);
      throw error;
    }
  }

  async getUserAnalytics(dateFilters = {}, groupBy = 'day') {
    try {
      const { startDate, endDate } = dateFilters;
      const dateFilter =
        startDate && endDate
          ? {
              createdAt: {
                gte: new Date(startDate),
                lte: new Date(endDate),
              },
            }
          : {};

      // Get user statistics
      const totalUsers = await context.database.user.count();
      const activeUsers = await context.database.user.count({
        where: {
          lastActiveAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
          },
        },
      });
      const premiumUsers = await context.database.user.count({
        where: { isPremium: true },
      });

      // Calculate new users for different periods
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
      const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

      const newToday = await context.database.user.count({
        where: { createdAt: { gte: today } },
      });
      const newThisWeek = await context.database.user.count({
        where: { createdAt: { gte: weekAgo } },
      });
      const newThisMonth = await context.database.user.count({
        where: { createdAt: { gte: monthAgo } },
      });

      // Generate time series data
      const periods = groupBy === 'month' ? 12 : groupBy === 'week' ? 4 : 30;
      const timeSeriesData = [];

      for (let i = periods - 1; i >= 0; i--) {
        const date = new Date();
        if (groupBy === 'month') {
          date.setMonth(date.getMonth() - i);
          date.setDate(1);
        } else if (groupBy === 'week') {
          date.setDate(date.getDate() - i * 7);
        } else {
          date.setDate(date.getDate() - i);
        }

        const periodStart = new Date(date);
        const periodEnd = new Date(date);

        if (groupBy === 'month') {
          periodEnd.setMonth(periodEnd.getMonth() + 1);
        } else if (groupBy === 'week') {
          periodEnd.setDate(periodEnd.getDate() + 7);
        } else {
          periodEnd.setDate(periodEnd.getDate() + 1);
        }

        const newUsersInPeriod = await context.database.user.count({
          where: {
            createdAt: {
              gte: periodStart,
              lt: periodEnd,
            },
          },
        });

        const activeUsersInPeriod = await context.database.user.count({
          where: {
            lastActiveAt: {
              gte: periodStart,
              lt: periodEnd,
            },
          },
        });

        timeSeriesData.push({
          date: periodStart.toISOString().split('T')[0],
          newUsers: newUsersInPeriod,
          activeUsers: activeUsersInPeriod,
          premiumUsers, // This would need historical tracking
        });
      }

      return {
        overview: {
          totalUsers,
          activeUsers,
          premiumUsers,
          newToday,
          newThisWeek,
          newThisMonth,
        },
        growth: {
          daily: 0, // Would need historical comparison
          weekly: 0,
          monthly: 0,
        },
        timeSeries: timeSeriesData,
        groupBy,
        timeRange: {
          startDate: dateFilters.startDate,
          endDate: dateFilters.endDate,
        },
      };
    } catch (error) {
      console.error('Error getting user analytics:', error);
      throw error;
    }
  }

  async getCommandAnalytics(dateFilters = {}, limit = 20) {
    try {
      const { startDate, endDate } = dateFilters;
      const dateFilter =
        startDate && endDate
          ? {
              createdAt: {
                gte: new Date(startDate),
                lte: new Date(endDate),
              },
            }
          : {};

      // Get command statistics
      const totalExecuted = await context.database.commandLog.count(dateFilter);

      // Get unique commands
      const uniqueCommandsResult = await context.database.commandLog.groupBy({
        by: ['command'],
        where: dateFilter,
        _count: { command: true },
      });
      const uniqueCommands = uniqueCommandsResult.length;

      // Get top commands
      const topCommandsRaw = await context.database.commandLog.groupBy({
        by: ['command'],
        where: dateFilter,
        _count: { command: true },
        orderBy: { _count: { command: 'desc' } },
        take: limit,
      });

      const topCommands = topCommandsRaw.map((cmd, index) => ({
        name: cmd.command,
        count: cmd._count.command,
        percentage: totalExecuted > 0 ? (cmd._count.command / totalExecuted) * 100 : 0,
      }));

      // Calculate average per user
      const totalUsers = await context.database.user.count();
      const averagePerUser = totalUsers > 0 ? totalExecuted / totalUsers : 0;

      // Get usage by hour
      const usageByHourRaw = await context.database.commandLog.groupBy({
        by: ['createdAt'],
        where: dateFilter,
        _count: { id: true },
      });

      const usageByHour = Array.from({ length: 24 }, (_, hour) => {
        const hourCommands = usageByHourRaw.filter(log => {
          const logHour = new Date(log.createdAt).getHours();
          return logHour === hour;
        });
        return {
          hour,
          count: hourCommands.reduce((sum, log) => sum + log._count.id, 0),
        };
      });

      // Find peak hour
      const peakHour = usageByHour.reduce(
        (max, current) => (current.count > max.count ? current : max),
        { hour: 0, count: 0 }
      ).hour;

      return {
        overview: {
          totalExecuted,
          uniqueCommands,
          averagePerUser,
          peakHour,
        },
        topCommands,
        usageByHour,
        timeRange: {
          startDate: dateFilters.startDate,
          endDate: dateFilters.endDate,
        },
      };
    } catch (error) {
      console.error('Error getting command analytics:', error);
      throw error;
    }
  }

  async getAIUsageAnalytics(dateFilters = {}, groupBy = 'day') {
    try {
      const { startDate, endDate } = dateFilters;
      const dateFilter =
        startDate && endDate
          ? {
              createdAt: {
                gte: new Date(startDate),
                lte: new Date(endDate),
              },
            }
          : {};

      // Get AI request statistics
      const totalRequests = await context.database.aiRequestLog.count(dateFilter);
      const successfulRequests = await context.database.aiRequestLog.count({
        where: { ...dateFilter, success: true },
      });
      const failedRequests = totalRequests - successfulRequests;

      // Calculate success rate
      const successRate = totalRequests > 0 ? (successfulRequests / totalRequests) * 100 : 0;

      // Get average response time
      const avgResponseTimeResult = await context.database.aiRequestLog.aggregate({
        _avg: { responseTime: true },
        where: { ...dateFilter, success: true },
      });
      const averageResponseTime = avgResponseTimeResult._avg.responseTime || 0;

      // Get top providers
      const topProvidersRaw = await context.database.aiRequestLog.groupBy({
        by: ['provider'],
        where: dateFilter,
        _count: { provider: true },
        orderBy: { _count: { provider: 'desc' } },
        take: 5,
      });

      const topProviders = topProvidersRaw.map(provider => ({
        name: provider.provider,
        requests: provider._count.provider,
        percentage: totalRequests > 0 ? (provider._count.provider / totalRequests) * 100 : 0,
      }));

      // Get usage by time period
      const periods = groupBy === 'month' ? 30 : groupBy === 'week' ? 7 : 1;
      const usageByPeriod = [];

      for (let i = periods - 1; i >= 0; i--) {
        const date = new Date();
        if (groupBy === 'month') {
          date.setDate(date.getDate() - i);
        } else if (groupBy === 'week') {
          date.setDate(date.getDate() - i * 7);
        } else {
          date.setDate(date.getDate() - i);
        }

        const periodStart = new Date(date);
        const periodEnd = new Date(date);

        if (groupBy === 'month') {
          periodEnd.setDate(periodEnd.getDate() + 1);
        } else if (groupBy === 'week') {
          periodEnd.setDate(periodEnd.getDate() + 7);
        } else {
          periodEnd.setDate(periodEnd.getDate() + 1);
        }

        const requestsInPeriod = await context.database.aiRequestLog.count({
          where: {
            createdAt: {
              gte: periodStart,
              lt: periodEnd,
            },
          },
        });

        usageByPeriod.push({
          date: periodStart.toISOString().split('T')[0],
          requests: requestsInPeriod,
        });
      }

      return {
        overview: {
          totalRequests,
          successfulRequests,
          failedRequests,
          successRate,
          averageResponseTime,
        },
        topProviders,
        usageByDay: usageByPeriod,
        groupBy,
        timeRange: {
          startDate: dateFilters.startDate,
          endDate: dateFilters.endDate,
        },
      };
    } catch (error) {
      console.error('Error getting AI usage analytics:', error);
      throw error;
    }
  }

  async getRevenueAnalytics(dateFilters = {}, groupBy = 'month') {
    try {
      const { startDate, endDate } = dateFilters;
      const dateFilter =
        startDate && endDate
          ? {
              createdAt: {
                gte: new Date(startDate),
                lte: new Date(endDate),
              },
            }
          : {};

      // Get revenue statistics
      const revenueResult = await context.database.subscription.aggregate({
        _sum: { amount: true },
        where: dateFilter,
      });
      const totalRevenue = revenueResult._sum.amount || 0;

      // Get monthly recurring revenue (active subscriptions)
      const activeSubscriptions = await context.database.subscription.findMany({
        where: {
          status: 'active',
          ...dateFilter,
        },
        select: { amount: true, interval: true },
      });

      const monthlyRecurringRevenue = activeSubscriptions
        .filter(sub => sub.interval === 'month')
        .reduce((sum, sub) => sum + sub.amount, 0);

      // Get average revenue per user
      const totalUsers = await context.database.user.count();
      const averageRevenuePerUser = totalUsers > 0 ? totalRevenue / totalUsers : 0;

      // Get top plans by revenue
      const topPlansRaw = await context.database.subscription.groupBy({
        by: ['planName'],
        where: dateFilter,
        _sum: { amount: true },
        _count: { planName: true },
        orderBy: { _sum: { amount: 'desc' } },
        take: 5,
      });

      const topPlans = topPlansRaw.map(plan => ({
        name: plan.planName,
        revenue: plan._sum.amount || 0,
        users: plan._count.planName,
        percentage: totalRevenue > 0 ? ((plan._sum.amount || 0) / totalRevenue) * 100 : 0,
      }));

      // Get revenue by time period
      const periods = 12; // Always show 12 months for revenue
      const revenueByMonth = [];

      for (let i = periods - 1; i >= 0; i--) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        date.setDate(1);

        const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
        const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59);

        const monthRevenue = await context.database.subscription.aggregate({
          _sum: { amount: true },
          where: {
            createdAt: {
              gte: monthStart,
              lte: monthEnd,
            },
          },
        });

        revenueByMonth.push({
          month: date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
          revenue: monthRevenue._sum.amount || 0,
        });
      }

      return {
        overview: {
          totalRevenue,
          monthlyRecurringRevenue,
          averageRevenuePerUser,
        },
        topPlans,
        revenueByMonth,
        groupBy,
        timeRange: {
          startDate: dateFilters.startDate,
          endDate: dateFilters.endDate,
        },
      };
    } catch (error) {
      console.error('Error getting revenue analytics:', error);
      throw error;
    }
  }

  async getModerationAnalytics(dateFilters = {}, groupBy = 'day') {
    try {
      const { startDate, endDate } = dateFilters;
      const dateFilter =
        startDate && endDate
          ? {
              createdAt: {
                gte: new Date(startDate),
                lte: new Date(endDate),
              },
            }
          : {};

      // Get moderation statistics
      const totalModerated = await context.database.moderationLog.count(dateFilter);
      const blockedContent = await context.database.moderationLog.count({
        where: { ...dateFilter, action: 'block' },
      });

      // Calculate approval rate (approved / total)
      const approvedContent = await context.database.moderationLog.count({
        where: { ...dateFilter, action: 'approve' },
      });
      const approvalRate = totalModerated > 0 ? (approvedContent / totalModerated) * 100 : 0;

      // Get average review time
      const avgReviewTimeResult = await context.database.moderationLog.aggregate({
        _avg: { reviewTime: true },
        where: dateFilter,
      });
      const averageReviewTime = avgReviewTimeResult._avg.reviewTime || 0;

      // Get violations by type
      const violationsByTypeRaw = await context.database.moderationLog.groupBy({
        by: ['violationType'],
        where: dateFilter,
        _count: { violationType: true },
      });

      const violationsByType = {};
      violationsByTypeRaw.forEach(violation => {
        violationsByType[violation.violationType] = violation._count.violationType;
      });

      // Get violations by severity
      const violationsBySeverityRaw = await context.database.moderationLog.groupBy({
        by: ['severity'],
        where: dateFilter,
        _count: { severity: true },
      });

      const violationsBySeverity = {};
      violationsBySeverityRaw.forEach(violation => {
        violationsBySeverity[violation.severity] = violation._count.severity;
      });

      // Get appealed decisions (assuming there's an appeal status)
      const appealedDecisions = await context.database.moderationLog.count({
        where: { ...dateFilter, appealed: true },
      });

      return {
        overview: {
          totalModerated,
          blockedContent,
          appealedDecisions,
          approvalRate,
          averageReviewTime,
        },
        violationsByType,
        violationsBySeverity,
        groupBy,
        timeRange: {
          startDate: dateFilters.startDate,
          endDate: dateFilters.endDate,
        },
      };
    } catch (error) {
      console.error('Error getting moderation analytics:', error);
      throw error;
    }
  }

  async getPerformanceAnalytics(dateFilters = {}, metrics = []) {
    // This will be implemented later
    return {
      overview: {
        averageResponseTime: 0,
        uptime: 0,
        errorRate: 0,
        throughput: 0,
        memoryUsage: 0,
        cpuUsage: 0,
      },
      responseTimeByEndpoint: [],
      metrics: metrics.length > 0 ? metrics : ['responseTime', 'uptime', 'errorRate', 'throughput'],
      timeRange: {
        startDate: dateFilters.startDate,
        endDate: dateFilters.endDate,
      },
    };
  }

  async getGeographicAnalytics(dateFilters = {}, metric = 'users') {
    // This will be implemented later
    return {
      topCountries: [],
      topCities: [],
      metric,
      timeRange: {
        startDate: dateFilters.startDate,
        endDate: dateFilters.endDate,
      },
    };
  }

  async getRealTimeAnalytics() {
    try {
      // Get active users (users active in last 5 minutes)
      const activeUsers = await context.database.user.count({
        where: {
          lastActiveAt: {
            gte: new Date(Date.now() - 5 * 60 * 1000),
          },
        },
      });

      // Get commands per minute (last 60 seconds)
      const oneMinuteAgo = new Date(Date.now() - 60 * 1000);
      const commandsPerMinute = await context.database.commandLog.count({
        where: { createdAt: { gte: oneMinuteAgo } },
      });

      // Get AI requests per minute
      const aiRequestsPerMinute = await context.database.aiRequestLog.count({
        where: { createdAt: { gte: oneMinuteAgo } },
      });

      // Get errors per minute (failed operations)
      const errorsPerMinute = await context.database.commandLog.count({
        where: {
          createdAt: { gte: oneMinuteAgo },
          success: false,
        },
      });

      // Get average response time (last hour)
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      const avgResponseTimeResult = await context.database.commandLog.aggregate({
        _avg: { responseTime: true },
        where: {
          createdAt: { gte: oneHourAgo },
          success: true,
        },
      });
      const averageResponseTime = avgResponseTimeResult._avg.responseTime || 0;

      // Server load (simplified - would need actual monitoring)
      const serverLoad = 25; // Placeholder

      return {
        activeUsers,
        commandsPerMinute,
        aiRequestsPerMinute,
        errorsPerMinute,
        averageResponseTime,
        serverLoad,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Error getting real-time analytics:', error);
      // Fallback to basic metrics
      return {
        activeUsers: 0,
        commandsPerMinute: 0,
        aiRequestsPerMinute: 0,
        errorsPerMinute: 0,
        averageResponseTime: 0,
        serverLoad: 0,
        timestamp: new Date().toISOString(),
      };
    }
  }

  async exportAnalytics(type, options = {}) {
    const { startDate, endDate, format = 'json' } = options;

    let data;
    switch (type) {
      case 'overview':
        data = await this.getSystemOverview({ startDate, endDate });
        break;
      case 'users':
        data = await this.getUserAnalytics({ startDate, endDate });
        break;
      case 'commands':
        data = await this.getCommandAnalytics({ startDate, endDate });
        break;
      case 'ai-usage':
        data = await this.getAIUsageAnalytics({ startDate, endDate });
        break;
      case 'revenue':
        data = await this.getRevenueAnalytics({ startDate, endDate });
        break;
      case 'moderation':
        data = await this.getModerationAnalytics({ startDate, endDate });
        break;
      case 'performance':
        data = await this.getPerformanceAnalytics({ startDate, endDate });
        break;
      default:
        throw new Error(`Unknown analytics type: ${type}`);
    }

    if (format === 'json') {
      return JSON.stringify(data, null, 2);
    }
    // Simple CSV conversion (would be more sophisticated in real implementation)
    return `Analytics Type: ${type}\n${JSON.stringify(data, null, 2)}`;
  }

  async getDashboardAnalytics() {
    try {
      const overview = await this.getSystemOverview();
      const realTime = await this.getRealTimeAnalytics();

      // Generate alerts based on real data
      const alerts = [];

      // Check for high error rates
      if (realTime.errorsPerMinute > 10) {
        alerts.push({
          type: 'error',
          message: `High error rate detected: ${realTime.errorsPerMinute} errors/minute`,
          timestamp: new Date().toISOString(),
        });
      }

      // Check for user milestones
      if (overview.summary.totalUsers >= 1000) {
        alerts.push({
          type: 'info',
          message: `User milestone reached: ${overview.summary.totalUsers} total users`,
          timestamp: new Date().toISOString(),
        });
      }

      // Check for high server load
      if (realTime.serverLoad > 80) {
        alerts.push({
          type: 'warning',
          message: `High server load: ${realTime.serverLoad}%`,
          timestamp: new Date().toISOString(),
        });
      }

      // Calculate real trends (simplified - would need historical data)
      const trends = {
        userGrowth: '+0%', // Would need historical comparison
        revenueGrowth: '+0%',
        commandUsage: '+0%',
      };

      return {
        overview: overview.summary,
        realTime,
        alerts,
        trends,
        lastUpdated: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Error getting dashboard analytics:', error);
      throw error;
    }
  }

  async getTrendsAnalytics(options = {}) {
    try {
      const { period = '30d', metrics = [] } = options;
      const periods = period === '7d' ? 7 : period === '90d' ? 90 : 30;

      const trendData = [];

      for (let i = periods - 1; i >= 0; i--) {
        const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
        const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
        const dayEnd = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59);

        const dataPoint = {
          date: dayStart.toISOString().split('T')[0],
        };

        const dateFilter = {
          createdAt: {
            gte: dayStart,
            lte: dayEnd,
          },
        };

        if (metrics.includes('users') || metrics.length === 0) {
          const newUsers = await context.database.user.count({ where: dateFilter });
          dataPoint.users = newUsers;
        }

        if (metrics.includes('commands') || metrics.length === 0) {
          const commands = await context.database.commandLog.count({ where: dateFilter });
          dataPoint.commands = commands;
        }

        if (metrics.includes('revenue') || metrics.length === 0) {
          const revenueResult = await context.database.subscription.aggregate({
            _sum: { amount: true },
            where: dateFilter,
          });
          dataPoint.revenue = revenueResult._sum.amount || 0;
        }

        if (metrics.includes('errors') || metrics.length === 0) {
          const errors = await context.database.commandLog.count({
            where: {
              ...dateFilter,
              success: false,
            },
          });
          dataPoint.errors = errors;
        }

        trendData.push(dataPoint);
      }

      return {
        period,
        metrics: metrics.length > 0 ? metrics : ['users', 'commands', 'revenue', 'errors'],
        data: trendData,
        lastUpdated: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Error getting trends analytics:', error);
      throw error;
    }
  }
}

module.exports = new AnalyticsService();
