import redis from 'redis';
import logger from '../utils/logger';

class CacheService {
  constructor() {
    this.client = null;
    this.isConnected = false;
    this.connect();
  }

  async connect() {
    try {
      this.client = redis.createClient({
        url: process.env.REDIS_URL || 'redis://localhost:6379',
        password: process.env.REDIS_PASSWORD,
      });

      this.client.on('error', err => {
        logger.error('Redis connection error:', err);
        this.isConnected = false;
      });

      this.client.on('connect', () => {
        logger.info('Connected to Redis');
        this.isConnected = true;
      });

      this.client.on('ready', () => {
        this.isConnected = true;
      });

      this.client.on('end', () => {
        this.isConnected = false;
      });

      await this.client.connect();
    } catch (error) {
      logger.error('Failed to connect to Redis:', error);
      this.isConnected = false;
    }
  }

  /**
   * Get a value from cache
   * @param {string} key - Cache key
   * @returns {Promise<any>} Cached value or null
   */
  async get(key) {
    if (!this.isConnected || !this.client) {
      return null;
    }

    try {
      const value = await this.client.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      logger.error('Cache get error:', error);
      return null;
    }
  }

  /**
   * Set a value in cache
   * @param {string} key - Cache key
   * @param {any} value - Value to cache
   * @param {number} ttlSeconds - Time to live in seconds (default: 3600)
   * @returns {Promise<boolean>} Success status
   */
  async set(key, value, ttlSeconds = 3600) {
    if (!this.isConnected || !this.client) {
      return false;
    }

    try {
      const serializedValue = JSON.stringify(value);
      if (ttlSeconds > 0) {
        await this.client.setEx(key, ttlSeconds, serializedValue);
      } else {
        await this.client.set(key, serializedValue);
      }
      return true;
    } catch (error) {
      logger.error('Cache set error:', error);
      return false;
    }
  }

  /**
   * Delete a key from cache
   * @param {string} key - Cache key
   * @returns {Promise<boolean>} Success status
   */
  async delete(key) {
    if (!this.isConnected || !this.client) {
      return false;
    }

    try {
      await this.client.del(key);
      return true;
    } catch (error) {
      logger.error('Cache delete error:', error);
      return false;
    }
  }

  /**
   * Check if key exists
   * @param {string} key - Cache key
   * @returns {Promise<boolean>} Whether key exists
   */
  async exists(key) {
    if (!this.isConnected || !this.client) {
      return false;
    }

    try {
      const result = await this.client.exists(key);
      return result === 1;
    } catch (error) {
      logger.error('Cache exists error:', error);
      return false;
    }
  }

  /**
   * Set multiple keys at once
   * @param {Object} keyValuePairs - Object with key-value pairs
   * @param {number} ttlSeconds - Time to live in seconds
   * @returns {Promise<boolean>} Success status
   */
  async mset(keyValuePairs, ttlSeconds = 3600) {
    if (!this.isConnected || !this.client) {
      return false;
    }

    try {
      const pipeline = this.client.multi();
      Object.entries(keyValuePairs).forEach(([key, value]) => {
        const serializedValue = JSON.stringify(value);
        if (ttlSeconds > 0) {
          pipeline.setEx(key, ttlSeconds, serializedValue);
        } else {
          pipeline.set(key, serializedValue);
        }
      });
      await pipeline.exec();
      return true;
    } catch (error) {
      logger.error('Cache mset error:', error);
      return false;
    }
  }

  /**
   * Get multiple keys at once
   * @param {Array<string>} keys - Array of cache keys
   * @returns {Promise<Object>} Object with key-value pairs
   */
  async mget(keys) {
    if (!this.isConnected || !this.client) {
      return {};
    }

    try {
      const values = await this.client.mGet(keys);
      const result = {};
      keys.forEach((key, index) => {
        if (values[index]) {
          try {
            result[key] = JSON.parse(values[index]);
          } catch (parseError) {
            logger.warn(`Failed to parse cached value for key ${key}:`, parseError);
            result[key] = null;
          }
        } else {
          result[key] = null;
        }
      });
      return result;
    } catch (error) {
      logger.error('Cache mget error:', error);
      return {};
    }
  }

  /**
   * Increment a numeric value
   * @param {string} key - Cache key
   * @param {number} amount - Amount to increment by (default: 1)
   * @returns {Promise<number|null>} New value or null on error
   */
  async increment(key, amount = 1) {
    if (!this.isConnected || !this.client) {
      return null;
    }

    try {
      return await this.client.incrBy(key, amount);
    } catch (error) {
      logger.error('Cache increment error:', error);
      return null;
    }
  }

  /**
   * Set expiration time for a key
   * @param {string} key - Cache key
   * @param {number} ttlSeconds - Time to live in seconds
   * @returns {Promise<boolean>} Success status
   */
  async expire(key, ttlSeconds) {
    if (!this.isConnected || !this.client) {
      return false;
    }

    try {
      return await this.client.expire(key, ttlSeconds);
    } catch (error) {
      logger.error('Cache expire error:', error);
      return false;
    }
  }

  /**
   * Get time to live for a key
   * @param {string} key - Cache key
   * @returns {Promise<number>} TTL in seconds (-2 if key doesn't exist, -1 if no expiration)
   */
  async ttl(key) {
    if (!this.isConnected || !this.client) {
      return -2;
    }

    try {
      return await this.client.ttl(key);
    } catch (error) {
      logger.error('Cache ttl error:', error);
      return -2;
    }
  }

  /**
   * Clear cache by pattern
   * @param {string} pattern - Pattern to match (e.g., 'user:*')
   * @returns {Promise<number>} Number of keys deleted
   */
  async invalidatePattern(pattern) {
    if (!this.isConnected || !this.client) {
      return 0;
    }

    try {
      const keys = await this.client.keys(pattern);
      if (keys.length > 0) {
        return await this.client.del(keys);
      }
      return 0;
    } catch (error) {
      logger.error('Cache invalidate pattern error:', error);
      return 0;
    }
  }

  /**
   * Get cache statistics
   * @returns {Promise<Object>} Cache statistics
   */
  async getStats() {
    if (!this.isConnected || !this.client) {
      return { connected: false };
    }

    try {
      const info = await this.client.info();
      const dbSize = await this.client.dbSize();

      return {
        connected: true,
        dbSize,
        info: this.parseRedisInfo(info),
      };
    } catch (error) {
      logger.error('Cache stats error:', error);
      return { connected: false, error: error.message };
    }
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
      if (!this.isConnected || !this.client) {
        return { status: 'disconnected' };
      }

      await this.client.ping();
      const stats = await this.getStats();

      return {
        status: 'healthy',
        ...stats,
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message,
      };
    }
  }

  /**
   * Close connection
   */
  async close() {
    if (this.client) {
      await this.client.quit();
      this.isConnected = false;
    }
  }
}

export default CacheService;
