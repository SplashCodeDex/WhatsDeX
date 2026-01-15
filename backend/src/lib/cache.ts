import crypto from 'crypto';
import redisClient from './redis.js';
import { Result } from '../types/index.js';

class Cache {
  private readonly redis: typeof redisClient;
  private readonly defaultTTL: number;

  constructor() {
    this.redis = redisClient;
    this.defaultTTL = 3600; // 1 hour
  }

  createKey(data: unknown): string {
    return crypto.createHash('md5').update(JSON.stringify(data)).digest('hex');
  }

  async get<T>(key: string): Promise<Result<T | null>> {
    try {
      const data = await this.redis.get(key);
      return { 
        success: true, 
        data: data ? (JSON.parse(data) as T) : null 
      };
    } catch (error: unknown) {
      return { 
        success: false, 
        error: error instanceof Error ? error : new Error('Unknown cache get error') 
      };
    }
  }

  async set(key: string, value: unknown, ttl: number = this.defaultTTL): Promise<Result<boolean>> {
    try {
      await this.redis.set(key, JSON.stringify(value), 'EX', ttl);
      return { success: true, data: true };
    } catch (error: unknown) {
      return { 
        success: false, 
        error: error instanceof Error ? error : new Error('Unknown cache set error') 
      };
    }
  }

  async del(key: string): Promise<Result<boolean>> {
    try {
      await this.redis.del(key);
      return { success: true, data: true };
    } catch (error: unknown) {
      return { 
        success: false, 
        error: error instanceof Error ? error : new Error('Unknown cache del error') 
      };
    }
  }
}

export const cache = new Cache();
export default cache;