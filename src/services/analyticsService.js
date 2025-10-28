const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

class AnalyticsService {

  async getSystemOverview(dateFilters = {}) {
    const where = this._getDateFilter(dateFilters);

    const [
      totalUsers,
      activeUsers,
      totalCommands,
      totalRevenue,
      moderationActions,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { lastActivity: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } } }),
      prisma.commandUsage.count({ where }),
      prisma.payment.aggregate({ _sum: { amount: true }, where: { ...where, status: 'completed' } }),
      prisma.userViolation.count({ where }),
    ]);

    return {
      summary: {
        totalUsers,
        activeUsers,
        totalCommands,
        totalRevenue: totalRevenue._sum.amount || 0,
        moderationActions,
      },
      lastUpdated: new Date().toISOString(),
    };
  }

  async getUserAnalytics(dateFilters = {}) {
    const where = this._getDateFilter(dateFilters, 'createdAt');

    const [
        totalUsers,
        activeUsers,
        premiumUsers,
        newThisMonth,
    ] = await Promise.all([
        prisma.user.count(),
        prisma.user.count({ where: { lastActivity: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } } }),
        prisma.user.count({ where: { premium: true } }),
        prisma.user.count({ where: { createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } } }),
    ]);

    return {
      overview: {
        totalUsers,
        activeUsers,
        premiumUsers,
        newThisMonth,
      },
      lastUpdated: new Date().toISOString(),
    };
  }

  async getCommandAnalytics(dateFilters = {}) {
    const where = this._getDateFilter(dateFilters, 'usedAt');

    const [
        totalExecuted,
        uniqueCommands,
        topCommands,
    ] = await Promise.all([
        prisma.commandUsage.count({ where }),
        prisma.commandUsage.groupBy({ by: ['command'], where }),
        prisma.commandUsage.groupBy({
            by: ['command'],
            _count: { command: true },
            where,
            orderBy: { _count: { command: 'desc' } },
            take: 10,
        }),
    ]);

    const totalUsers = await prisma.user.count();

    return {
      overview: {
        totalExecuted,
        uniqueCommands: uniqueCommands.length,
        averagePerUser: totalUsers > 0 ? (totalExecuted / totalUsers) : 0,
      },
      topCommands: topCommands.map(c => ({
        name: c.command,
        count: c._count.command,
        percentage: totalExecuted > 0 ? (c._count.command / totalExecuted) * 100 : 0,
      })),
      lastUpdated: new Date().toISOString(),
    };
  }

  async getRevenueAnalytics(dateFilters = {}) {
    const where = this._getDateFilter(dateFilters, 'createdAt');

    const totalRevenue = await prisma.payment.aggregate({
        _sum: { amount: true },
        where: { ...where, status: 'completed' },
    });

    return {
      overview: {
        totalRevenue: totalRevenue._sum.amount || 0,
      },
      lastUpdated: new Date().toISOString(),
    };
  }

  _getDateFilter(dateFilters, field = 'createdAt') {
    const where = {};
    if (dateFilters.startDate || dateFilters.endDate) {
      where[field] = {};
      if (dateFilters.startDate) {
        where[field].gte = new Date(dateFilters.startDate);
      }
      if (dateFilters.endDate) {
        where[field].lte = new Date(dateFilters.endDate);
      }
    }
    return where;
  }
}

module.exports = new AnalyticsService();
