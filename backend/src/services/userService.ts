import prisma from '../lib/prisma';
import logger from '../utils/logger';

class UserService {
  // Map status using DB fields
  computeStatus(user) {
    if (user.banned) return 'banned';
    const last = user.lastActivity ? new Date(user.lastActivity).getTime() : 0;
    const days30 = 30 * 24 * 60 * 60 * 1000;
    return Date.now() - last > days30 ? 'inactive' : 'active';
  }

  async getUserActivePlan(userId) {
    try {
      const sub = await prisma.subscription.findFirst({
        where: { userId, status: { in: ['active', 'trialing'] } },
        orderBy: { currentPeriodEnd: 'desc' },
        include: { plan: true }
      });
      if (!sub?.plan) return 'free';
      const code = sub.plan.code?.toLowerCase() || sub.plan.name?.toLowerCase();
      if (!code) return 'free';
      if (['free','basic','pro','business','enterprise'].includes(code)) {
        return code === 'business' ? 'pro' : code; // map business->pro if needed
      }
      return 'pro';
    } catch (_) {
      return 'free';
    }
  }

  async getUsers(filters = {}, options = {}) {
    const { page = 1, limit = 20 } = options;

    // Base query for users; name/email/phone search
    const where = {};
    if (filters.search) {
      const search = filters.search;
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search } },
        { jid: { contains: search } },
      ];
    }

    // Sorting
    const sortMap = { name: 'name', email: 'email', createdAt: 'createdAt', lastActivity: 'lastActivity', level: 'level' };
    const orderBy = {};
    const sortField = sortMap[filters.sortBy] || 'createdAt';
    orderBy[sortField] = filters.sortOrder === 'asc' ? 'asc' : 'desc';

    const [total, rows] = await Promise.all([
      prisma.user.count({ where }),
      prisma.user.findMany({ where, orderBy, skip: (page - 1) * limit, take: limit }),
    ]);

    // Enrich with derived fields (status, plan, activity metrics)
    const enriched = await Promise.all(rows.map(async (u) => {
      const status = this.computeStatus(u);
      const plan = await this.getUserActivePlan(u.id);
      // Commands used
      let commandsUsed = 0;
      try {
        const agg = await prisma.commandUsage.aggregate({ where: { userId: u.id, success: true }, _count: { _all: true } });
        commandsUsed = agg._count?._all || 0;
      } catch (_) {}
      // AI requests (approx from analytics table or AI commands subset) — fallback to 0
      let aiRequests = 0;
      try {
        const aggAI = await prisma.commandUsage.aggregate({
          where: { userId: u.id, command: { in: ['gemini','venice','dalle','text2image','videogpt'] } },
          _count: { _all: true }
        });
        aiRequests = aggAI._count?._all || 0;
      } catch (_) {}
      // Total spent from Payments
      let totalSpent = 0;
      try {
        const payments = await prisma.payment.findMany({ where: { userId: u.id, status: { in: ['completed','succeeded'] } }, select: { amount: true } });
        totalSpent = payments.reduce((s, p) => s + (p.amount || 0), 0);
      } catch (_) {}

      return {
        id: u.id,
        jid: u.jid,
        name: u.name,
        email: u.email,
        phone: u.phone,
        avatar: u.avatar,
        level: u.level,
        xp: u.xp,
        premium: u.premium,
        premiumExpiry: u.premiumExpiry,
        banned: u.banned,
        banReason: u.banReason,
        lastActivity: u.lastActivity,
        createdAt: u.createdAt,
        status,
        plan,
        commandsUsed,
        aiRequests,
        totalSpent,
      };
    }));

    // Apply status/plan filters post-enrichment if provided
    let filtered = enriched;
    if (filters.status) filtered = filtered.filter(u => u.status === filters.status);
    if (filters.plan) filtered = filtered.filter(u => (u.plan || 'free') === filters.plan);

    // Re-apply pagination if filtered count changed
    const totalAfter = filtered.length;
    const startIndex = (page - 1) * limit;
    const pageItems = filtered.slice(startIndex, startIndex + limit);

    return { users: pageItems, total: totalAfter, page, limit };
  }

  async getUserById(id) {
    const u = await prisma.user.findUnique({ where: { id } });
    if (!u) return null;
    const [plan, status] = await Promise.all([
      this.getUserActivePlan(u.id),
      Promise.resolve(this.computeStatus(u)),
    ]);
    // Commands used
    let commandsUsed = 0;
    try {
      const agg = await prisma.commandUsage.aggregate({ where: { userId: u.id, success: true }, _count: { _all: true } });
      commandsUsed = agg._count?._all || 0;
    } catch (_) {}
    let aiRequests = 0;
    try {
      const aggAI = await prisma.commandUsage.aggregate({ where: { userId: u.id, command: { in: ['gemini','venice','dalle','text2image','videogpt'] } }, _count: { _all: true } });
      aiRequests = aggAI._count?._all || 0;
    } catch (_) {}
    let totalSpent = 0;
    try {
      const payments = await prisma.payment.findMany({ where: { userId: u.id, status: { in: ['completed','succeeded'] } }, select: { amount: true } });
      totalSpent = payments.reduce((s, p) => s + (p.amount || 0), 0);
    } catch (_) {}

    return { ...u, status, plan, commandsUsed, aiRequests, totalSpent };
  }

  async createUser(userData) {
    const created = await prisma.user.create({
      data: {
        jid: userData.jid || userData.phone ? `${userData.phone}@s.whatsapp.net` : undefined,
        name: userData.name || null,
        phone: userData.phone || null,
        email: userData.email || null,
        avatar: userData.avatar || null,
        premium: userData.premium || false,
        premiumExpiry: userData.premiumExpiry ? new Date(userData.premiumExpiry) : null,
        banned: userData.banned || false,
        banReason: userData.banReason || null,
      }
    });
    return this.getUserById(created.id);
  }

  async updateUser(id, updateData) {
    const updated = await prisma.user.update({
      where: { id },
      data: {
        name: updateData.name,
        phone: updateData.phone,
        email: updateData.email,
        avatar: updateData.avatar,
        premium: typeof updateData.premium === 'boolean' ? updateData.premium : undefined,
        premiumExpiry: updateData.premiumExpiry ? new Date(updateData.premiumExpiry) : undefined,
        banned: typeof updateData.banned === 'boolean' ? updateData.banned : undefined,
        banReason: updateData.banReason,
      }
    }).catch(() => null);
    if (!updated) return null;
    return this.getUserById(id);
  }

  async deleteUser(id) {
    const existing = await prisma.user.findUnique({ where: { id } });
    if (!existing) return null;
    await prisma.user.delete({ where: { id } });
    return existing;
  }

  async bulkAction(action, userIds, options = {}) {
    const results = { successful: [], failed: [] };

    for (const userId of userIds) {
      try {
        switch (action) {
          case 'ban':
            results.successful.push(await this.updateUser(userId, { banned: true }));
            break;
          case 'unban':
            results.successful.push(await this.updateUser(userId, { banned: false }));
            break;
          case 'delete':
            const deleted = await this.deleteUser(userId);
            if (deleted) results.successful.push(deleted);
            else results.failed.push({ id: userId, error: 'User not found' });
            break;
          case 'update_plan':
            // Not directly supported on User; would require creating a Subscription entry
            if (!options.plan) throw new Error('plan is required');
            results.failed.push({ id: userId, error: 'update_plan not implemented on User model' });
            break;
          default:
            throw new Error(`Unknown action: ${action}`);
        }
      } catch (error) {
        results.failed.push({ id: userId, error: error.message });
      }
    }

    // Filter out nulls
    results.successful = results.successful.filter(Boolean);
    return results;
  }

  async exportUsers(filters = {}, format = 'json') {
    const { users } = await this.getUsers(filters, { page: 1, limit: 10000 });

    if (format === 'csv') {
      const headers = ['ID','Name','Email','Phone','Plan','Status','Created At','Last Activity','Commands Used','AI Requests','Total Spent','Level','XP'];
      const rows = users.map(u => [
        u.id,
        u.name || '',
        u.email || '',
        u.phone || '',
        u.plan || 'free',
        u.status,
        u.createdAt?.toISOString?.() || new Date(u.createdAt).toISOString(),
        u.lastActivity?.toISOString?.() || (u.lastActivity ? new Date(u.lastActivity).toISOString() : ''),
        u.commandsUsed,
        u.aiRequests,
        u.totalSpent,
        u.level,
        u.xp,
      ]);
      return [headers, ...rows].map(r => r.join(',')).join('\n');
    }

    return JSON.stringify(users, null, 2);
  }

  async getStatistics() {
    const totalUsers = await prisma.user.count();
    const bannedUsers = await prisma.user.count({ where: { banned: true } });
    const premiumUsers = await prisma.user.count({ where: { premium: true } });

    // Active users in last 30 days
    const activeSince = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const activeUsers = await prisma.user.count({ where: { lastActivity: { gte: activeSince } } });

    const totalCommandsAgg = await prisma.commandUsage.aggregate({ _count: { _all: true } });
    const totalAIRequestsAgg = await prisma.commandUsage.aggregate({ where: { command: { in: ['gemini','venice','dalle','text2image','videogpt'] } }, _count: { _all: true } });

    const totalRevenueAgg = await prisma.payment.aggregate({ _sum: { amount: true }, where: { status: { in: ['completed','succeeded'] } } });

    return {
      overview: {
        totalUsers,
        activeUsers,
        premiumUsers,
        bannedUsers,
      },
      activity: {
        totalCommands: totalCommandsAgg._count?._all || 0,
        totalAIRequests: totalAIRequestsAgg._count?._all || 0,
        averageCommandsPerUser: totalUsers > 0 ? Math.round((totalCommandsAgg._count?._all || 0) / totalUsers) : 0,
        averageAIRequestsPerUser: totalUsers > 0 ? Math.round((totalAIRequestsAgg._count?._all || 0) / totalUsers) : 0,
      },
      revenue: {
        totalRevenue: totalRevenueAgg._sum?.amount || 0,
        averageRevenuePerUser: totalUsers > 0 ? Math.round(((totalRevenueAgg._sum?.amount || 0) / totalUsers) * 100) / 100 : 0,
      },
      lastUpdated: new Date().toISOString(),
    };
  }
}

export default new UserService();
