const Redis = require('ioredis');
const logger = require('../utils/logger');

class CacheService {
  constructor() {
    this.redis = null;
    this.isConnected = false;
    this.defaultTTL = 3600; // 1 hour default TTL
  }

  async connect() {
    try {
      this.redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
        password: process.env.REDIS_PASSWORD || undefined,
        retryDelayOnFailover: 100,
        maxRetriesPerRequest: 3,
        lazyConnect: true,
      });

      // Event handlers
      this.redis.on('connect', () => {
        this.isConnected = true;
        logger.info('Redis connected successfully');
      });

      this.redis.on('error', (error) => {
        this.isConnected = false;
        logger.error('Redis connection error', { error: error.message });
      });

      this.redis.on('ready', () => {
        logger.info('Redis is ready to receive commands');
      });

      await this.redis.connect();
    } catch (error) {
      logger.error('Failed to connect to Redis', { error: error.message });
      throw error;
    }
  }

  async disconnect() {
    try {
      if (this.redis) {
        await this.redis.quit();
        this.isConnected = false;
        logger.info('Redis disconnected successfully');
      }
    } catch (error) {
      logger.error('Failed to disconnect from Redis', { error: error.message });
      throw error;
    }
  }

  // Generic cache methods
  async get(key) {
    try {
      if (!this.isConnected) return null;

      const value = await this.redis.get(key);
      if (value) {
        logger.debug(`Cache hit for key: ${key}`);
        return JSON.parse(value);
      }

      logger.debug(`Cache miss for key: ${key}`);
      return null;
    } catch (error) {
      logger.error('Error getting from cache', { key, error: error.message });
      return null;
    }
  }

  async set(key, value, ttl = this.defaultTTL) {
    try {
      if (!this.isConnected) return false;

      const serializedValue = JSON.stringify(value);
      const result = await this.redis.setex(key, ttl, serializedValue);

      logger.debug(`Cache set for key: ${key}, TTL: ${ttl}s`);
      return result === 'OK';
    } catch (error) {
      logger.error('Error setting cache', { key, error: error.message });
      return false;
    }
  }

  async del(key) {
    try {
      if (!this.isConnected) return 0;

      const result = await this.redis.del(key);
      logger.debug(`Cache deleted for key: ${key}`);
      return result;
    } catch (error) {
      logger.error('Error deleting from cache', { key, error: error.message });
      return 0;
    }
  }

  async exists(key) {
    try {
      if (!this.isConnected) return false;

      const result = await this.redis.exists(key);
      return result === 1;
    } catch (error) {
      logger.error('Error checking cache existence', { key, error: error.message });
      return false;
    }
  }

  // User-specific cache methods
  getUserKey(jid) {
    return `user:${jid}`;
  }

  async getUser(jid) {
    const key = this.getUserKey(jid);
    return await this.get(key);
  }

  async setUser(jid, userData, ttl = 1800) { // 30 minutes
    const key = this.getUserKey(jid);
    return await this.set(key, userData, ttl);
  }

  async invalidateUser(jid) {
    const key = this.getUserKey(jid);
    return await this.del(key);
  }

  // Group-specific cache methods
  getGroupKey(jid) {
    return `group:${jid}`;
  }

  async getGroup(jid) {
    const key = this.getGroupKey(jid);
    return await this.get(key);
  }

  async setGroup(jid, groupData, ttl = 1800) { // 30 minutes
    const key = this.getGroupKey(jid);
    return await this.set(key, groupData, ttl);
  }

  async invalidateGroup(jid) {
    const key = this.getGroupKey(jid);
    return await this.del(key);
  }

  // Command-specific cache methods
  getCommandKey(command, userId = null) {
    return userId ? `cmd:${command}:${userId}` : `cmd:${command}`;
  }

  async getCommandResult(command, userId = null, ttl = 300) { // 5 minutes
    const key = this.getCommandKey(command, userId);
    return await this.get(key);
  }

  async setCommandResult(command, result, userId = null, ttl = 300) {
    const key = this.getCommandKey(command, userId);
    return await this.set(key, result, ttl);
  }

  // AI response caching
  getAIKey(prompt, model = 'gpt-4o-mini') {
    const hash = require('crypto').createHash('md5').update(prompt).digest('hex');
    return `ai:${model}:${hash}`;
  }

  async getAIResponse(prompt, model = 'gpt-4o-mini') {
    const key = this.getAIKey(prompt, model);
    return await this.get(key);
  }

  async setAIResponse(prompt, response, model = 'gpt-4o-mini', ttl = 3600) { // 1 hour
    const key = this.getAIKey(prompt, model);
    return await this.set(key, response, ttl);
  }

  // Rate limiting cache methods
  getRateLimitKey(identifier, action = 'general') {
    return `ratelimit:${action}:${identifier}`;
  }

  async checkRateLimit(identifier, action = 'general', limit = 100, windowMs = 900000) { // 15 minutes
    const key = this.getRateLimitKey(identifier, action);

    try {
      const current = await this.redis.get(key) || 0;
      const count = parseInt(current) + 1;

      if (count > limit) {
        return { allowed: false, remaining: 0, resetTime: windowMs };
      }

      // Set or increment the counter
      await this.redis.setex(key, Math.ceil(windowMs / 1000), count);

      return {
        allowed: true,
        remaining: limit - count,
        resetTime: windowMs
      };
    } catch (error) {
      logger.error('Error checking rate limit', { identifier, action, error: error.message });
      return { allowed: true, remaining: limit, resetTime: windowMs }; // Allow on error
    }
  }

  // Session management
  getSessionKey(sessionId) {
    return `session:${sessionId}`;
  }

  async getSession(sessionId) {
    const key = this.getSessionKey(sessionId);
    return await this.get(key);
  }

  async setSession(sessionId, sessionData, ttl = 86400) { // 24 hours
    const key = this.getSessionKey(sessionId);
    return await this.set(key, sessionData, ttl);
  }

  async destroySession(sessionId) {
    const key = this.getSessionKey(sessionId);
    return await this.del(key);
  }

  // Analytics caching
  async getAnalyticsCache(timeframe = '24h') {
    const key = `analytics:${timeframe}`;
    return await this.get(key);
  }

  async setAnalyticsCache(timeframe, data, ttl = 300) { // 5 minutes
    const key = `analytics:${timeframe}`;
    return await this.set(key, data, ttl);
  }

  // Bulk operations
  async invalidatePattern(pattern) {
    try {
      if (!this.isConnected) return 0;

      const keys = await this.redis.keys(pattern);
      if (keys.length > 0) {
        const result = await this.redis.del(...keys);
        logger.debug(`Invalidated ${result} keys matching pattern: ${pattern}`);
        return result;
      }

      return 0;
    } catch (error) {
      logger.error('Error invalidating pattern', { pattern, error: error.message });
      return 0;
    }
  }

  // Cache statistics
  async getStats() {
    try {
      if (!this.isConnected) return null;

      const info = await this.redis.info();
      const dbSize = await this.redis.dbsize();

      return {
        connected: this.isConnected,
        dbSize,
        info: this.parseRedisInfo(info)
      };
    } catch (error) {
      logger.error('Error getting cache stats', { error: error.message });
      return null;
    }
  }

  parseRedisInfo(info) {
    const lines = info.split('\r\n');
    const parsed = {};

    lines.forEach(line => {
      if (line.includes(':')) {
        const [key, value] = line.split(':');
        parsed[key] = value;
      }
    });

    return parsed;
  }

  // Health check
  async healthCheck() {
    try {
      if (!this.isConnected) return { status: 'disconnected' };

      await this.redis.ping();
      return { status: 'healthy', latency: await this.redis.ping() };
    } catch (error) {
      logger.error('Cache health check failed', { error: error.message });
      return { status: 'unhealthy', error: error.message };
    }
  }

  // Pub/Sub methods for real-time features
  async publish(channel, message) {
    try {
      if (!this.isConnected) return 0;

      const result = await this.redis.publish(channel, JSON.stringify(message));
      logger.debug(`Published message to channel: ${channel}`);
      return result;
    } catch (error) {
      logger.error('Error publishing message', { channel, error: error.message });
      return 0;
    }
  }

  async subscribe(channel, callback) {
    try {
      if (!this.isConnected) return;

      const subscriber = this.redis.duplicate();
      await subscriber.subscribe(channel);

      subscriber.on('message', (ch, message) => {
        if (ch === channel) {
          try {
            const data = JSON.parse(message);
            callback(data);
          } catch (error) {
            logger.error('Error parsing pub/sub message', { channel, message, error: error.message });
          }
        }
      });

      logger.debug(`Subscribed to channel: ${channel}`);
      return subscriber;
    } catch (error) {
      logger.error('Error subscribing to channel', { channel, error: error.message });
      throw error;
    }
  }
}

module.exports = CacheService;