const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

class UserService {
  async getUsers(filters = {}, options = {}) {
    const { page = 1, limit = 20 } = options;
    const where = {};

    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { email: { contains: filters.search, mode: 'insensitive' } },
        { phone: { contains: filters.search } },
      ];
    }

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.plan) {
      where.premium = filters.plan !== 'free';
    }

    const users = await prisma.user.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: filters.sortBy ? { [filters.sortBy]: filters.sortOrder || 'asc' } : undefined,
    });

    const total = await prisma.user.count({ where });

    return {
      users,
      total,
      page,
      limit,
    };
  }

  async getUserById(id) {
    return prisma.user.findUnique({
      where: { id },
    });
  }

  async createUser(userData) {
    return prisma.user.create({
      data: userData,
    });
  }

  async updateUser(id, updateData) {
    return prisma.user.update({
      where: { id },
      data: updateData,
    });
  }

  async deleteUser(id) {
    return prisma.user.delete({
      where: { id },
    });
  }

  async bulkAction(action, userIds, options = {}) {
    const results = {
      successful: [],
      failed: [],
    };

    for (const userId of userIds) {
      try {
        let updatedUser;

        switch (action) {
          case 'ban':
            updatedUser = await this.updateUser(userId, { banned: true, banReason: options.reason || 'Banned by admin' });
            break;
          case 'unban':
            updatedUser = await this.updateUser(userId, { banned: false, banReason: null });
            break;
          case 'delete':
            updatedUser = await this.deleteUser(userId);
            break;
          case 'update_plan':
            if (options.plan) {
              updatedUser = await this.updateUser(userId, { premium: options.plan !== 'free' });
            }
            break;
          default:
            throw new Error(`Unknown action: ${action}`);
        }

        if (updatedUser) {
          results.successful.push(updatedUser);
        } else {
          results.failed.push({ id: userId, error: 'User not found' });
        }
      } catch (error) {
        results.failed.push({ id: userId, error: error.message });
      }
    }

    return results;
  }

  async exportUsers(filters = {}, format = 'json') {
    const { users } = await this.getUsers(filters, { limit: 10000 });

    if (format === 'csv') {
      const headers = ['ID', 'Name', 'Email', 'Phone', 'Plan', 'Status', 'Join Date', 'Last Activity', 'Commands Used', 'AI Requests', 'Total Spent', 'Level', 'XP'];
      const rows = users.map(user => [
        user.id,
        user.name,
        user.email,
        user.phone,
        user.premium ? 'premium' : 'free',
        user.banned ? 'banned' : 'active',
        user.createdAt.toISOString(),
        user.lastActivity.toISOString(),
        user.commandsUsed || 0,
        user.aiRequests || 0,
        user.totalSpent || 0,
        user.level,
        user.xp
      ]);

      return [headers, ...rows].map(row => row.join(',')).join('\n');
    }

    return JSON.stringify(users, null, 2);
  }

  async getStatistics() {
    const totalUsers = await prisma.user.count();
    const activeUsers = await prisma.user.count({ where: { banned: false } });
    const premiumUsers = await prisma.user.count({ where: { premium: true } });
    const bannedUsers = await prisma.user.count({ where: { banned: true } });

    // These stats would need to be implemented properly with relations
    const totalCommands = 0; // await prisma.commandUsage.count();
    const totalAIRequests = 0; // This would need a similar tracking mechanism
    const totalRevenue = 0; // await prisma.payment.aggregate({ _sum: { amount: true } });

    return {
      overview: {
        totalUsers,
        activeUsers,
        premiumUsers,
        bannedUsers,
      },
      activity: {
        totalCommands,
        totalAIRequests,
        averageCommandsPerUser: totalUsers > 0 ? Math.round(totalCommands / totalUsers) : 0,
        averageAIRequestsPerUser: totalUsers > 0 ? Math.round(totalAIRequests / totalUsers) : 0,
      },
      revenue: {
        totalRevenue: totalRevenue || 0,
        averageRevenuePerUser: totalUsers > 0 ? Math.round((totalRevenue || 0) / totalUsers * 100) / 100 : 0,
        premiumRevenue: totalRevenue || 0,
      },
      lastUpdated: new Date().toISOString(),
    };
  }
}

module.exports = new UserService();
