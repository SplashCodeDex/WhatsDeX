// Simplified context with single Prisma database system
const config = require("./config.js");
const pkg = require("./package.json");
const tools = require("./tools/exports.js");
const formatter = require("./utils/formatter.js");

const logger = require("./src/utils/logger");

const DatabaseService = require('./src/services/database');
const databaseService = new DatabaseService();
const prisma = databaseService.prisma;

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
    get: (key) => databaseService.getBotSetting(key),
    set: (key, value, category, description, updatedBy) => databaseService.setBotSetting(key, value, category, description, updatedBy),
    update: (key, data) => databaseService.updateBotSetting(key, data)
  },
  menfess: {
    get: (id) => databaseService.getMenfess(id),
    create: (menfessData) => databaseService.createMenfess(menfessData),
    delete: (id) => databaseService.deleteMenfess(id)
  }
};

const state = require("./state.js");

const context = {
  config,
  database,
  databaseService,
  
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