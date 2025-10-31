// Mock User Service for testing
// This will be replaced with actual database implementation in Phase 7.2

class UserService {
  constructor() {
    this.users = new Map();
    this.nextId = 1;

    // Add some mock users for testing
    this.initializeMockData();
  }

  initializeMockData() {
    const mockUsers = [
      {
        id: 'user-1',
        name: 'John Doe',
        email: 'john@example.com',
        phone: '+1234567890',
        plan: 'pro',
        status: 'active',
        joinDate: new Date('2024-01-15'),
        lastActivity: new Date(),
        commandsUsed: 1250,
        aiRequests: 340,
        totalSpent: 299.99,
        level: 15,
        xp: 8750,
      },
      {
        id: 'user-2',
        name: 'Jane Smith',
        email: 'jane@example.com',
        phone: '+1234567891',
        plan: 'basic',
        status: 'active',
        joinDate: new Date('2024-02-20'),
        lastActivity: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
        commandsUsed: 890,
        aiRequests: 156,
        totalSpent: 149.99,
        level: 12,
        xp: 6200,
      },
      {
        id: 'user-3',
        name: 'Bob Johnson',
        email: 'bob@example.com',
        phone: '+1234567892',
        plan: 'free',
        status: 'inactive',
        joinDate: new Date('2024-03-10'),
        lastActivity: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
        commandsUsed: 45,
        aiRequests: 12,
        totalSpent: 0,
        level: 3,
        xp: 180,
      },
    ];

    mockUsers.forEach(user => {
      this.users.set(user.id, user);
      this.nextId = Math.max(this.nextId, parseInt(user.id.split('-')[1]) + 1);
    });
  }

  async getUsers(filters = {}, options = {}) {
    const { page = 1, limit = 20 } = options;
    let users = Array.from(this.users.values());

    // Apply filters
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      users = users.filter(
        user =>
          user.name.toLowerCase().includes(searchTerm) ||
          user.email.toLowerCase().includes(searchTerm) ||
          user.phone.includes(searchTerm)
      );
    }

    if (filters.status) {
      users = users.filter(user => user.status === filters.status);
    }

    if (filters.plan) {
      users = users.filter(user => user.plan === filters.plan);
    }

    // Apply sorting
    if (filters.sortBy) {
      users.sort((a, b) => {
        const aVal = a[filters.sortBy];
        const bVal = b[filters.sortBy];

        if (filters.sortOrder === 'desc') {
          return aVal < bVal ? 1 : -1;
        }
        return aVal > bVal ? 1 : -1;
      });
    }

    const total = users.length;
    const startIndex = (page - 1) * limit;
    const paginatedUsers = users.slice(startIndex, startIndex + limit);

    return {
      users: paginatedUsers,
      total,
      page,
      limit,
    };
  }

  async getUserById(id) {
    return this.users.get(id) || null;
  }

  async createUser(userData) {
    const id = `user-${this.nextId++}`;
    const newUser = {
      id,
      ...userData,
      joinDate: new Date(),
      lastActivity: new Date(),
      commandsUsed: 0,
      aiRequests: 0,
      totalSpent: 0,
      level: 1,
      xp: 0,
    };

    this.users.set(id, newUser);
    return newUser;
  }

  async updateUser(id, updateData) {
    const user = this.users.get(id);
    if (!user) return null;

    const updatedUser = { ...user, ...updateData };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async deleteUser(id) {
    const user = this.users.get(id);
    if (!user) return null;

    this.users.delete(id);
    return user;
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
            updatedUser = await this.updateUser(userId, { status: 'banned' });
            break;
          case 'unban':
            updatedUser = await this.updateUser(userId, { status: 'active' });
            break;
          case 'delete':
            updatedUser = await this.deleteUser(userId);
            break;
          case 'update_plan':
            if (options.plan) {
              updatedUser = await this.updateUser(userId, { plan: options.plan });
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
      const headers = [
        'ID',
        'Name',
        'Email',
        'Phone',
        'Plan',
        'Status',
        'Join Date',
        'Last Activity',
        'Commands Used',
        'AI Requests',
        'Total Spent',
        'Level',
        'XP',
      ];
      const rows = users.map(user => [
        user.id,
        user.name,
        user.email,
        user.phone,
        user.plan,
        user.status,
        user.joinDate.toISOString(),
        user.lastActivity.toISOString(),
        user.commandsUsed,
        user.aiRequests,
        user.totalSpent,
        user.level,
        user.xp,
      ]);

      return [headers, ...rows].map(row => row.join(',')).join('\n');
    }

    return JSON.stringify(users, null, 2);
  }

  async getStatistics() {
    const users = Array.from(this.users.values());
    const totalUsers = users.length;
    const activeUsers = users.filter(u => u.status === 'active').length;
    const premiumUsers = users.filter(u => u.plan !== 'free').length;
    const bannedUsers = users.filter(u => u.status === 'banned').length;

    const totalCommands = users.reduce((sum, u) => sum + u.commandsUsed, 0);
    const totalAIRequests = users.reduce((sum, u) => sum + u.aiRequests, 0);
    const totalRevenue = users.reduce((sum, u) => sum + u.totalSpent, 0);

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
        totalRevenue,
        averageRevenuePerUser:
          totalUsers > 0 ? Math.round((totalRevenue / totalUsers) * 100) / 100 : 0,
        premiumRevenue: users
          .filter(u => u.plan !== 'free')
          .reduce((sum, u) => sum + u.totalSpent, 0),
      },
      lastUpdated: new Date().toISOString(),
    };
  }
}

module.exports = new UserService();
