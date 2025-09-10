// Simplified context with single Prisma database system
const config = require("./config.js");
const pkg = require("./package.json");
const tools = require("./tools/exports.js");
const formatter = require("./utils/formatter.js");
// Initialize consolefy
const { Consolefy } = require("@mengkodingan/consolefy");
const consolefy = new Consolefy({
    tag: pkg.name
});
const logger = require("./src/utils/logger");

// Initialize Prisma database service
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

// Database service wrapper
class DatabaseService {
  constructor() {
    this.prisma = prisma;
  }

  // User operations
  async getUser(jid) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { jid },
        include: {
          groups: {
            include: { group: true }
          },
          subscriptions: {
            include: { plan: true },
            where: { status: 'active' }
          }
        }
      });

      if (user) {
        return {
          ...user,
          premium: user.premium || user.subscriptions.length > 0,
          groups: user.groups.map(ug => ug.groupId)
        };
      }
      return null;
    } catch (error) {
      logger.error('Database error in getUser:', error);
      throw error;
    }
  }

  async createUser(userData) {
    try {
      return await this.prisma.user.create({
        data: {
          jid: userData.jid,
          name: userData.name,
          phone: userData.phone,
          avatar: userData.avatar,
          xp: userData.xp || 0,
          level: userData.level || 1,
          coin: userData.coin || 0,
          premium: userData.premium || false,
          banned: userData.banned || false
        }
      });
    } catch (error) {
      logger.error('Database error in createUser:', error);
      throw error;
    }
  }

  async updateUser(jid, updateData) {
    try {
      return await this.prisma.user.update({
        where: { jid },
        data: updateData
      });
    } catch (error) {
      logger.error('Database error in updateUser:', error);
      throw error;
    }
  }

  async upsertUser(userData) {
    try {
      return await this.prisma.user.upsert({
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
          banned: userData.banned || false
        }
      });
    } catch (error) {
      logger.error('Database error in upsertUser:', error);
      throw error;
    }
  }

  // Group operations
  async getGroup(jid) {
    try {
      const group = await this.prisma.group.findUnique({
        where: { jid },
        include: {
          users: { include: { user: true } },
          settings: true
        }
      });

      if (group) {
        return {
          ...group,
          members: group.users.map(ug => ({
            jid: ug.user.jid,
            role: ug.role
          })),
          settings: group.settings.reduce((acc, setting) => {
            acc[setting.settingKey] = setting.settingValue;
            return acc;
          }, {})
        };
      }
      return null;
    } catch (error) {
      logger.error('Database error in getGroup:', error);
      throw error;
    }
  }

  async createGroup(groupData) {
    try {
      return await this.prisma.group.create({
        data: {
          jid: groupData.jid,
          name: groupData.name,
          description: groupData.description,
          avatar: groupData.avatar,
          ownerJid: groupData.ownerJid,
          memberCount: groupData.memberCount || 0
        }
      });
    } catch (error) {
      logger.error('Database error in createGroup:', error);
      throw error;
    }
  }

  async updateGroup(jid, updateData) {
    try {
      return await this.prisma.group.update({
        where: { jid },
        data: updateData
      });
    } catch (error) {
      logger.error('Database error in updateGroup:', error);
      throw error;
    }
  }

  // Health check
  async healthCheck() {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return { status: 'healthy', database: 'connected' };
    } catch (error) {
      return { status: 'unhealthy', database: 'disconnected', error: error.message };
    }
  }

  // Connection management
  async connect() {
    try {
      await this.prisma.$connect();
      logger.info('Database connected successfully');
    } catch (error) {
      logger.error('Failed to connect to database:', error);
      throw error;
    }
  }

  async disconnect() {
    try {
      await this.prisma.$disconnect();
      logger.info('Database disconnected successfully');
    } catch (error) {
      logger.error('Failed to disconnect from database:', error);
      throw error;
    }
  }
}

// Initialize database service
const databaseService = new DatabaseService();

// Legacy database interface for backward compatibility
const database = {
  user: {
    get: (jid) => databaseService.getUser(jid),
    create: (userData) => databaseService.createUser(userData),
    update: (jid, data) => databaseService.updateUser(jid, data),
    upsert: (userData) => databaseService.upsertUser(userData)
  },
  group: {
    get: (jid) => databaseService.getGroup(jid),
    create: (groupData) => databaseService.createGroup(groupData),
    update: (jid, data) => databaseService.updateGroup(jid, data)
  },
  bot: {
    get: () => Promise.resolve({}), // Placeholder
    update: () => Promise.resolve() // Placeholder
  },
  menfess: {
    get: () => Promise.resolve({}), // Placeholder
    create: () => Promise.resolve() // Placeholder
  }
};

const state = require("./state.js");

// Create context object
const context = {
  config,
  database,
  databaseService,
  consolefy, // Add consolefy to context
  formatter,
  state,
  tools,
  prisma, // Direct Prisma access for advanced queries

  // Initialize services
  async initialize() {
    try {
      await databaseService.connect();
      logger.info('All services initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize services:', error);
      throw error;
    }
  },

  // Graceful shutdown
  async shutdown() {
    try {
      await databaseService.disconnect();
      logger.info('All services shut down successfully');
    } catch (error) {
      logger.error('Error during services shutdown:', error);
      throw error;
    }
  }
};

module.exports = context;