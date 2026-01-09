import crypto from 'crypto';
import redisClient from './redis.js';


class Cache {
  private redis: any;
  private defaultTTL: number;

  constructor() {
    this.redis = redisClient;
    this.defaultTTL = 3600; // 1 hour
  }

  createKey(data) {
    return crypto.createHash('md5').update(JSON.stringify(data)).digest('hex');
  }

  async get(key) {
    try {
      const data = await this.redis.get(key);
      return data ? JSON.parse(data) : null;
    } catch (error: any) {
      console.error('Cache get error:', error);
      return null;
    }
  }

  async set(key, value, ttl = this.defaultTTL) {
    try {
      await this.redis.set(key, JSON.stringify(value), 'EX', ttl);
      return true;
    } catch (error: any) {
      console.error('Cache set error:', error);
      return false;
    }
  }

  async del(key) {
    try {
      await this.redis.del(key);
      return true;
    } catch (error: any) {
      console.error('Cache del error:', error);
      return false;
    }
  }
}

export default new Cache();
