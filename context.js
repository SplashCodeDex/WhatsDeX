ontext.js</path>
<content">// Enhanced context object
const context = {
  config,
  consolefy: legacyConsole, // Keep legacy for compatibility
  logger, // Enhanced logger
  db: databaseService, // PostgreSQL database
  legacyDb, // Fallback database
  database, // Unified database interface
  cache: cacheService, // Redis cache
  jobQueue: jobQueueService, // Background job processing
  jobRegistry, // Job processors registry
  errorHandler, // Error handling service
  migration: migrationService, // Migration service
  formatter: Formatter,
  state,
  tools,

  // Service health checks
  async healthCheck() {
    const health = {
      database: await databaseService.healthCheck(),
      cache: await cacheService.healthCheck(),
      jobQueue: await jobQueueService.healthCheck(),
      jobRegistry: await jobRegistry.healthCheck(),
      errorHandler: await errorHandler.healthCheck(),
      timestamp: new Date().toISOString()
    };

    return health;
  },

  // Graceful shutdown
  async shutdown() {
    logger.info('Shutting down enhanced context...');

    try {
      await databaseService.disconnect();
      await cacheService.disconnect();
      await jobQueueService.closeAllQueues();
      logger.info('All services shut down successfully');
    } catch (error) {
      logger.error('Error during shutdown', { error: error.message });
    }
  }
};