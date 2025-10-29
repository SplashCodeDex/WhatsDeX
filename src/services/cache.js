import { Redis } from '@upstash/redis';
import logger from '../utils/logger';

class CacheService {
  constructor() {
    if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
      logger.warn('Upstash Redis environment variables not set. Cache service will be disabled.');
      this.redis = null;
      this.isConnected = false;
    } else {
      this.redis = new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
      });
      this.isConnected = true;
      logger.info('Upstash Redis client initialized.');
    }
    this.defaultTTL = 3600; // 1 hour default TTL
  }

  async get(key) {
    if (!this.isConnected) return null;
    try {
      const value = await this.redis.get(key);
      if (value) {
        logger.debug(`Cache hit for key: ${key}`);
        return value; // Upstash client handles JSON parsing
      }
      logger.debug(`Cache miss for key: ${key}`);
      return null;
    } catch (error) {
      logger.error('Error getting from Upstash Redis', { key, error: error.message });
      return null;
    }
  }

  async set(key, value, ttl = this.defaultTTL) {
    if (!this.isConnected) return false;
    try {
      const result = await this.redis.set(key, value, { ex: ttl });
      logger.debug(`Cache set for key: ${key}, TTL: ${ttl}s`);
      return result === 'OK';
    } catch (error) {
      logger.error('Error setting Upstash Redis cache', { key, error: error.message });
      return false;
    }
  }

  async del(key) {
    if (!this.isConnected) return 0;
    try {
      const result = await this.redis.del(key);
      logger.debug(`Cache deleted for key: ${key}`);
      return result;
    } catch (error) {
      logger.error('Error deleting from Upstash Redis', { key, error: error.message });
      return 0;
    }
  }

  async exists(key) {
    if (!this.isConnected) return false;
    try {
      const result = await this.redis.exists(key);
      return result === 1;
    } catch (error) {
      logger.error('Error checking Upstash Redis cache existence', { key, error: error.message });
      return false;
    }
  }

  // ... (The rest of the helper methods can remain the same, as they use the generic get/set/del methods)
  
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
        if (!this.isConnected) return { allowed: true, remaining: limit, resetTime: windowMs };
      const current = await this.redis.get(key) || 0;
      const count = parseInt(current) + 1;

      if (count > limit) {
        return { allowed: false, remaining: 0, resetTime: windowMs };
      }

      // Set or increment the counter
      await this.redis.set(key, count, { ex: Math.ceil(windowMs / 1000) });

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
    if (!this.isConnected) return 0;
    try {
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

  // Health check
  async healthCheck() {
    if (!this.isConnected) return { status: 'disconnected' };
    try {
      const start = Date.now();
      await this.redis.ping();
      const latency = Date.now() - start;
      return { status: 'healthy', latency };
    } catch (error) {
      logger.error('Upstash Redis health check failed', { error: error.message });
      return { status: 'unhealthy', error: error.message };
    }
  }
}

module.exports = CacheService;