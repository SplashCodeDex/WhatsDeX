import { PrismaClient } from '@prisma/client';
import logger from '../utils/logger.js';

class DatabaseService {
  constructor() {
    this.prisma = new PrismaClient({
      log: [
        { level: 'query', emit: 'event' },
        { level: 'info', emit: 'event' },
        { level: 'warn', emit: 'event' },
        { level: 'error', emit: 'event' },
      ],
    });

    // Log database events
    this.prisma.$on('query', e => {
      logger.debug(`Query: ${e.query}`, { duration: e.duration, params: e.params });
    });

    this.prisma.$on('info', e => {
      logger.info(`Database Info: ${e.message}`);
    });

    this.prisma.$on('warn', e => {
      logger.warn(`Database Warning: ${e.message}`);
    });

    this.prisma.$on('error', e => {
      logger.error(`Database Error: ${e.message}`);
    });

    this.isConnected = false;
  }

  async connect() {
    try {
      console.log(
        'Attempting DB connect; DATABASE_URL exists:',
        process.env.DATABASE_URL ? 'yes (masked)' : 'no'
      );
      console.log('Prisma client initialized:', !!this.prisma);
      await this.prisma.$connect();
      this.isConnected = true;
      logger.info('Database connected successfully');
      console.log('DB connected successfully');
    } catch (error) {
      console.log('DB connect failed:', error.message);
      logger.error('Failed to connect to database', { error: error.message });
      throw error;
    }
  }

  async disconnect() {
    try {
      await this.prisma.$disconnect();
      this.isConnected = false;
      logger.info('Database disconnected successfully');
    } catch (error) {
      logger.error('Failed to disconnect from database', { error: error.message });
      throw error;
    }
  }

  // User management methods
  async getUser(jid) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { jid },
        include: {
          groups: {
            include: {
              group: true,
            },
          },
          subscriptions: {
            include: {
              plan: true,
            },
            where: {
              status: 'active',
            },
          },
        },
      });

      if (user) {
        // Convert to the format expected by existing code
        return {
          ...user,
          premium: user.premium || user.subscriptions.length > 0,
          groups: user.groups.map(ug => ug.groupId),
        };
      }

      return null;
    } catch (error) {
      logger.error('Error getting user', { jid, error: error.message });
      throw error;
    }
  }

  async createUser(userData) {
    try {
      const user = await this.prisma.user.create({
        data: {
          jid: userData.jid,
          name: userData.name,
          phone: userData.phone,
          avatar: userData.avatar,
          xp: userData.xp || 0,
          level: userData.level || 1,
          coin: userData.coin || 0,
          premium: userData.premium || false,
          banned: userData.banned || false,
        },
      });

      logger.info('User created', { userId: user.id, jid: user.jid });
      return user;
    } catch (error) {
      logger.error('Error creating user', { userData, error: error.message });
      throw error;
    }
  }

  async updateUser(jid, updateData) {
    try {
      const user = await this.prisma.user.update({
        where: { jid },
        data: updateData,
      });

      logger.info('User updated', { jid, updates: Object.keys(updateData) });
      return user;
    } catch (error) {
      logger.error('Error updating user', { jid, updateData, error: error.message });
      throw error;
    }
  }

  async upsertUser(userData) {
    try {
      const user = await this.prisma.user.upsert({
        where: { jid: userData.jid },
        update: userData,
        create: {
          jid: userData.jid,
          name: userData.name,
          phone: userData.phone,
          avatar: userData.avatar,
          xp: userData.xp || 0,
          level: userData.level || 1,
          coin: userData.coin || 0,
          premium: userData.premium || false,
          banned: userData.banned || false,
        },
      });

      return user;
    } catch (error) {
      logger.error('Error upserting user', { userData, error: error.message });
      throw error;
    }
  }

  // Group management methods
  async getGroup(jid) {
    try {
      const group = await this.prisma.group.findUnique({
        where: { jid },
        include: {
          users: {
            include: {
              user: true,
            },
          },
          settings: true,
        },
      });

      if (group) {
        return {
          ...group,
          members: group.users.map(ug => ({
            jid: ug.user.jid,
            role: ug.role,
          })),
          settings: group.settings.reduce((acc, setting) => {
            acc[setting.settingKey] = setting.settingValue;
            return acc;
          }, {}),
        };
      }

      return null;
    } catch (error) {
      logger.error('Error getting group', { jid, error: error.message });
      throw error;
    }
  }

  async createGroup(groupData) {
    try {
      const group = await this.prisma.group.create({
        data: {
          jid: groupData.jid,
          name: groupData.name,
          description: groupData.description,
          avatar: groupData.avatar,
          ownerJid: groupData.ownerJid,
          memberCount: groupData.memberCount || 0,
        },
      });

      logger.info('Group created', { groupId: group.id, jid: group.jid });
      return group;
    } catch (error) {
      logger.error('Error creating group', { groupData, error: error.message });
      throw error;
    }
  }

  async updateGroup(jid, updateData) {
    try {
      const group = await this.prisma.group.update({
        where: { jid },
        data: updateData,
      });

      logger.info('Group updated', { jid, updates: Object.keys(updateData) });
      return group;
    } catch (error) {
      logger.error('Error updating group', { jid, updateData, error: error.message });
      throw error;
    }
  }

  // User-Group relationship methods
  async addUserToGroup(userJid, groupJid, role = 'member') {
    try {
      const userGroup = await this.prisma.userGroup.create({
        data: {
          userId: (await this.getUser(userJid)).id,
          groupId: (await this.getGroup(groupJid)).id,
          role,
        },
      });

      logger.info('User added to group', { userJid, groupJid, role });
      return userGroup;
    } catch (error) {
      logger.error('Error adding user to group', { userJid, groupJid, role, error: error.message });
      throw error;
    }
  }

  async removeUserFromGroup(userJid, groupJid) {
    try {
      const user = await this.getUser(userJid);
      const group = await this.getGroup(groupJid);

      await this.prisma.userGroup.delete({
        where: {
          userId_groupId: {
            userId: user.id,
            groupId: group.id,
          },
        },
      });

      logger.info('User removed from group', { userJid, groupJid });
    } catch (error) {
      logger.error('Error removing user from group', { userJid, groupJid, error: error.message });
      throw error;
    }
  }

  // Command usage tracking
  async logCommandUsage(
    userJid,
    command,
    category,
    success = true,
    executionTime = null,
    error = null
  ) {
    try {
      const user = await this.getUser(userJid);
      if (!user) return;

      await this.prisma.commandUsage.create({
        data: {
          userId: user.id,
          command,
          category,
          success,
          executionTime,
          errorMessage: error?.message,
        },
      });

      logger.command(command, userJid, success, executionTime, error);
    } catch (err) {
      logger.error('Error logging command usage', { userJid, command, error: err.message });
    }
  }

  // Analytics methods
  async recordAnalytics(metric, value, category, metadata = {}) {
    try {
      await this.prisma.analytics.create({
        data: {
          metric,
          value: parseFloat(value),
          category,
          metadata: JSON.stringify(metadata),
        },
      });
    } catch (error) {
      logger.error('Error recording analytics', { metric, value, category, error: error.message });
    }
  }

  async getAnalytics(timeframe = '24 hours') {
    try {
      const startDate = new Date(Date.now() - this.parseTimeframe(timeframe));

      const analytics = await this.prisma.analytics.findMany({
        where: {
          recordedAt: {
            gte: startDate,
          },
        },
        orderBy: {
          recordedAt: 'desc',
        },
      });

      return analytics.map(item => ({
        ...item,
        metadata: JSON.parse(item.metadata || '{}'),
      }));
    } catch (error) {
      logger.error('Error getting analytics', { timeframe, error: error.message });
      throw error;
    }
  }

  // Utility methods
  parseTimeframe(timeframe) {
    const match = timeframe.match(/(\d+)\s*(hour|day|week|month)s?/i);
    if (!match) return 24 * 60 * 60 * 1000; // 24 hours default

    const value = parseInt(match[1]);
    const unit = match[2].toLowerCase();

    const multipliers = {
      hour: 60 * 60 * 1000,
      day: 24 * 60 * 60 * 1000,
      week: 7 * 24 * 60 * 60 * 1000,
      month: 30 * 24 * 60 * 60 * 1000,
    };

    return value * multipliers[unit];
  }

  // Health check
  async healthCheck() {
    try {
      console.log('Health check: Prisma available:', !!this.prisma);
      if (this.prisma && typeof this.prisma.$queryRaw === 'function') {
        await this.prisma.$queryRaw`SELECT 1`;
        console.log('Health check passed');
        return { status: 'healthy', database: 'connected' };
      }
      throw new Error('$queryRaw not available on prisma client');
    } catch (error) {
      console.log('Health check failed:', error.message);
      logger.error('Database health check failed', { error: error.message });
      return { status: 'unhealthy', database: 'disconnected', error: error.message };
    }
  }

  // Migration helpers
  async migrateFromSimplDB(oldDb) {
    try {
      logger.info('Starting migration from SimplDB to PostgreSQL');

      // Migrate users
      const users = oldDb.get('users') || {};
      for (const [jid, userData] of Object.entries(users)) {
        await this.upsertUser({
          jid,
          ...userData,
        });
      }

      // Migrate groups
      const groups = oldDb.get('groups') || {};
      for (const [jid, groupData] of Object.entries(groups)) {
        await this.createGroup({
          jid,
          ...groupData,
        });
      }

      logger.info('Migration completed successfully');
    } catch (error) {
      logger.error('Migration failed', { error: error.message });
      throw error;
    }
  }
}

export default DatabaseService;
