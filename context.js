// Simplified context with single Prisma database system
import { PrismaClient } from '@prisma/client';
import config from './config.js';
import pkg from './package.json' with { type: 'json' };
import tools from './tools/exports.js';
import * as formatter from './utils/formatter.js'; // keep legacy formatter interface
import logger from './src/utils/logger.js';
import state from './state.js';
import { UnifiedCommandSystem } from './src/services/UnifiedCommandSystem.js';
import { UnifiedAIProcessor } from './src/services/UnifiedAIProcessor.js';

// This function will initialize and return the fully prepared context
async function initializeContext() {
  // Initialize Prisma database service with proper connection management
  const prisma = new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    datasources: {
      db: {
        url: process.env.DATABASE_URL
      }
    },
    __internal: {
      engine: {
        binary: {
          queryEngineTimeout: 60000,
          queryEngineLibrary: undefined
        }
      }
    }
  });

  // Test database connection
  try {
    await prisma.$connect();
    logger.info('✅ Database connection verified');
  } catch (error) {
    logger.error('❌ Database connection failed:', { error: error.message });
    logger.error('Please check your DATABASE_URL and ensure the database is running.');
    process.exit(1);
  }

  // Add connection error handling
  if (typeof prisma.$on === 'function') {
    prisma.$on('error', (error) => {
      logger.error('🔴 Database error:', { error });
    });
  }

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
                include: { group: true },
              },
              subscriptions: {
                include: { plan: true },
                where: { status: 'active' },
              },
            },
          });
    
          if (user) {
            return {
              ...user,
              premium: user.premium || user.subscriptions.length > 0,
              groups: user.groups.map(ug => ug.groupId),
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
              banned: userData.banned || false,
            },
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
            data: updateData,
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
              banned: userData.banned || false,
            },
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
              memberCount: groupData.memberCount || 0,
            },
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
            data: updateData,
          });
        } catch (error) {
          logger.error('Database error in updateGroup:', error);
          throw error;
        }
      }
    
      // BotSetting operations
      async getBotSetting(key) {
        try {
          return await this.prisma.botSetting.findUnique({
            where: { key },
          });
        } catch (error) {
          logger.error('Database error in getBotSetting:', error);
          throw error;
        }
      }
    
      async setBotSetting(key, value, category = 'general', description = null, updatedBy = 'system') {
        try {
          return await this.prisma.botSetting.upsert({
            where: { key },
            update: { value, category, description, updatedBy },
            create: { key, value, category, description, updatedBy },
          });
        } catch (error) {
          logger.error('Database error in setBotSetting:', error);
          throw error;
        }
      }
    
      async updateBotSetting(key, updateData) {
        try {
          return await this.prisma.botSetting.update({
            where: { key },
            data: updateData,
          });
        } catch (error) {
          logger.error('Database error in updateBotSetting:', error);
          throw error;
        }
      }
    
      // Menfess operations
      async getMenfess(id) {
        try {
          return await this.prisma.menfess.findUnique({
            where: { id },
          });
        } catch (error) {
          logger.error('Database error in getMenfess:', error);
          throw error;
        }
      }
    
      async createMenfess(menfessData) {
        try {
          return await this.prisma.menfess.create({
            data: menfessData,
          });
        } catch (error) {
          logger.error('Database error in createMenfess:', error);
          throw error;
        }
      }
    
      async deleteMenfess(id) {
        try {
          return await this.prisma.menfess.delete({
            where: { id },
          });
        } catch (error) {
          logger.error('Database error in deleteMenfess:', error);
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

  const databaseService = new DatabaseService();

  // Legacy database interface for backward compatibility
  const database = {
    user: {
      get: jid => databaseService.getUser(jid),
      create: userData => databaseService.createUser(userData),
      update: (jid, data) => databaseService.updateUser(jid, data),
      upsert: userData => databaseService.upsertUser(userData),
    },
    group: {
      get: jid => databaseService.getGroup(jid),
      create: groupData => databaseService.createGroup(groupData),
      update: (jid, data) => databaseService.updateGroup(jid, data),
    },
    bot: {
      get: key => databaseService.getBotSetting(key),
      set: (key, value, category, description, updatedBy) =>
        databaseService.setBotSetting(key, value, category, description, updatedBy),
      update: (key, data) => databaseService.updateBotSetting(key, data),
    },
    menfess: {
      get: id => databaseService.getMenfess(id),
      create: menfessData => databaseService.createMenfess(menfessData),
      delete: id => databaseService.deleteMenfess(id),
    },
  };

  // Build the context object now that services are set up
  const context = {
    config,
    database,
    databaseService,
    formatter,
    state,
    tools,
    prisma,
    logger,
  };

  // Instantiate systems that depend on context
  const commandSystem = new UnifiedCommandSystem(null, context);
  const unifiedAI = new UnifiedAIProcessor(null, context);
  context.commandSystem = commandSystem;
  context.unifiedAI = unifiedAI;

  // Attach graceful shutdown
  context.shutdown = async function shutdown() {
    await databaseService.disconnect();
  };

  return context;
}

export default initializeContext;