const { RateLimiterRedis } = require('rate-limiter-flexible');
const logger = require('../utils/logger');

class RateLimiterService {
  constructor() {
    this.limiters = new Map();
    this.redisClient = null;

    // Initialize Redis client
    try {
      const redis = require('redis');
      this.redisClient = redis.createClient({
        url: process.env.REDIS_URL || 'redis://localhost:6379',
        password: process.env.REDIS_PASSWORD
      });

      this.redisClient.on('error', (err) => {
        logger.error('Rate limiter Redis connection error:', err);
      });

      this.redisClient.on('connect', () => {
        logger.info('Rate limiter connected to Redis');
      });

      // Connect to Redis
      this.redisClient.connect().catch(err => {
        logger.error('Failed to connect rate limiter to Redis:', err);
      });
    } catch (error) {
      logger.error('Failed to initialize Redis for rate limiter:', error);
    }
  }

  /**
   * Get or create a rate limiter for specific configuration
   * @param {Object} config - Rate limiter configuration
   * @param {number} config.points - Number of requests allowed
   * @param {number} config.duration - Time window in seconds
   * @param {string} config.keyPrefix - Prefix for Redis keys
   * @returns {RateLimiterRedis} Rate limiter instance
   */
  getLimiter(config) {
    const key = `${config.points}:${config.duration}:${config.keyPrefix || 'default'}`;

    if (!this.limiters.has(key)) {
      if (!this.redisClient) {
        throw new Error('Redis client not available for rate limiting');
      }

      this.limiters.set(key, new RateLimiterRedis({
        storeClient: this.redisClient,
        points: config.points,
        duration: config.duration,
        keyPrefix: config.keyPrefix || 'rl',
        inmemoryBlockOnConsumed: config.points, // Block if consumed all points
        inmemoryBlockDuration: config.blockDuration || 60, // Block duration in seconds
        insuranceLimiter: new RateLimiterRedis({
          storeClient: this.redisClient,
          points: Math.floor(config.points / 2),
          duration: config.duration * 2,
          keyPrefix: `${config.keyPrefix || 'rl'}_insurance`
        })
      }));
    }

    return this.limiters.get(key);
  }

  /**
   * Check if request is allowed
   * @param {string} key - Unique identifier for the requester
   * @param {Object} config - Rate limiter configuration
   * @returns {Promise<boolean>} Whether the request is allowed
   */
  async check(key, config) {
    try {
      const limiter = this.getLimiter(config);
      await limiter.consume(key);
      return true;
    } catch (rejRes) {
      logger.warn('Rate limit exceeded', {
        key,
        points: config.points,
        duration: config.duration,
        remainingPoints: rejRes.remainingPoints,
        msBeforeNext: rejRes.msBeforeNext
      });
      return false;
    }
  }

  /**
   * Get rate limit status for a key
   * @param {string} key - Unique identifier for the requester
   * @param {Object} config - Rate limiter configuration
   * @returns {Promise<Object>} Rate limit status
   */
  async getStatus(key, config) {
    try {
      const limiter = this.getLimiter(config);
      const res = await limiter.get(key);

      return {
        remainingPoints: res.remainingPoints,
        msBeforeNext: res.msBeforeNext,
        consumedPoints: res.consumedPoints,
        isBlocked: false
      };
    } catch (error) {
      return {
        remainingPoints: 0,
        msBeforeNext: 0,
        consumedPoints: config.points,
        isBlocked: true,
        error: error.message
      };
    }
  }

  /**
   * Block a key manually
   * @param {string} key - Unique identifier for the requester
   * @param {number} seconds - Block duration in seconds
   * @param {Object} config - Rate limiter configuration
   * @returns {Promise<boolean>} Success status
   */
  async block(key, seconds, config) {
    try {
      const limiter = this.getLimiter(config);
      await limiter.block(key, seconds);
      logger.info('Manually blocked key', { key, seconds });
      return true;
    } catch (error) {
      logger.error('Failed to block key', { key, error: error.message });
      return false;
    }
  }

  /**
   * Unblock a key
   * @param {string} key - Unique identifier for the requester
   * @param {Object} config - Rate limiter configuration
   * @returns {Promise<boolean>} Success status
   */
  async unblock(key, config) {
    try {
      const limiter = this.getLimiter(config);
      await limiter.delete(key);
      logger.info('Unblocked key', { key });
      return true;
    } catch (error) {
      logger.error('Failed to unblock key', { key, error: error.message });
      return false;
    }
  }

  /**
   * Penalize a key (consume extra points)
   * @param {string} key - Unique identifier for the requester
   * @param {number} points - Points to consume
   * @param {Object} config - Rate limiter configuration
   * @returns {Promise<boolean>} Success status
   */
  async penalize(key, points, config) {
    try {
      const limiter = this.getLimiter(config);
      await limiter.penalty(key, points);
      logger.info('Penalized key', { key, points });
      return true;
    } catch (error) {
      logger.error('Failed to penalize key', { key, error: error.message });
      return false;
    }
  }

  /**
   * Reward a key (reduce consumed points)
   * @param {string} key - Unique identifier for the requester
   * @param {number} points - Points to reward
   * @param {Object} config - Rate limiter configuration
   * @returns {Promise<boolean>} Success status
   */
  async reward(key, points, config) {
    try {
      const limiter = this.getLimiter(config);
      await limiter.reward(key, points);
      logger.info('Rewarded key', { key, points });
      return true;
    } catch (error) {
      logger.error('Failed to reward key', { key, error: error.message });
      return false;
    }
  }

  /**
   * Create predefined rate limiters for common use cases
   */
  createPresetLimiters() {
    return {
      // AI Chat commands - strict limits
      aiChat: {
        points: 20, // 20 requests
        duration: 60, // per minute
        keyPrefix: 'ai_chat'
      },

      // General commands - moderate limits
      generalCommands: {
        points: 50, // 50 requests
        duration: 60, // per minute
        keyPrefix: 'general'
      },

      // Media processing - lower limits due to resource usage
      mediaProcessing: {
        points: 10, // 10 requests
        duration: 60, // per minute
        keyPrefix: 'media'
      },

      // API endpoints - higher limits for web dashboard
      apiRequests: {
        points: 100, // 100 requests
        duration: 60, // per minute
        keyPrefix: 'api'
      },

      // File uploads - strict limits
      fileUploads: {
        points: 5, // 5 uploads
        duration: 300, // per 5 minutes
        keyPrefix: 'upload'
      },

      // Admin actions - very strict limits
      adminActions: {
        points: 10, // 10 actions
        duration: 60, // per minute
        keyPrefix: 'admin'
      }
    };
  }

  /**
   * Get rate limiter statistics
   * @returns {Promise<Object>} Statistics about rate limiters
   */
  async getStats() {
    const stats = {
      connected: !!this.redisClient,
      limitersCount: this.limiters.size,
      limiters: []
    };

    if (this.redisClient) {
      try {
        // Get Redis stats
        const redisInfo = await this.redisClient.info();
        stats.redis = this.parseRedisInfo(redisInfo);
      } catch (error) {
        stats.redis = { error: error.message };
      }
    }

    // Get limiter configurations
    for (const [key, limiter] of this.limiters) {
      stats.limiters.push({
        key,
        points: limiter.points,
        duration: limiter.duration,
        keyPrefix: limiter.keyPrefix
      });
    }

    return stats;
  }

  /**
   * Parse Redis INFO command output
   * @param {string} info - Raw Redis info
   * @returns {Object} Parsed info object
   */
  parseRedisInfo(info) {
    const lines = info.split('\n');
    const parsed = {};

    lines.forEach(line => {
      if (line.includes(':')) {
        const [key, value] = line.split(':');
        parsed[key] = value;
      }
    });

    return parsed;
  }

  /**
   * Health check
   * @returns {Promise<Object>} Health status
   */
  async healthCheck() {
    try {
      if (!this.redisClient) {
        return { status: 'disconnected', service: 'rate-limiter' };
      }

      await this.redisClient.ping();

      return {
        status: 'healthy',
        service: 'rate-limiter',
        limiters: this.limiters.size
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        service: 'rate-limiter',
        error: error.message
      };
    }
  }

  /**
   * Close Redis connection
   */
  async close() {
    if (this.redisClient) {
      await this.redisClient.quit();
    }
  }
}

module.exports = RateLimiterService;