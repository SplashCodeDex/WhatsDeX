import redis from '../lib/redis.js';
import logger from '../utils/logger.js';
import { Result } from '../types/index.js';

export class CacheService {
  private static instance: CacheService;
  private client: typeof redis;
  private isConnected: boolean;
  private defaultTTL: number;

  private constructor() {
    this.client = redis;
    this.isConnected = false;
    this.defaultTTL = 3600; // 1 hour

    this.setupListeners();
  }

  public static getInstance(): CacheService {
    if (!CacheService.instance) {
      CacheService.instance = new CacheService();
    }
    return CacheService.instance;
  }

  private setupListeners(): void {
    this.client.on('error', (err: Error) => {
      logger.error('Redis Error:', err);
      this.isConnected = false;
    });

    this.client.on('connect', () => {
      this.isConnected = true;
      logger.info('Redis Connected');
    });

    this.client.on('ready', () => {
      this.isConnected = true;
    });

    this.client.on('end', () => {
      this.isConnected = false;
    });
  }

  createKey(data: any): string {
    const serialized = typeof data === 'string' ? data : JSON.stringify(data);
    return `cache:${Buffer.from(serialized).toString('base64').substring(0, 32)}`;
  }

  async get<T>(key: string): Promise<Result<T | null>> {
    if (!this.isConnected) {
      return { success: false, error: new Error('Cache not connected') };
    }

    try {
      const value = await this.client.get(key);
      if (!value) return { success: true, data: null };

      try {
        const data = JSON.parse(value) as T;
        return { success: true, data };
      } catch (parseError) {
        return { success: true, data: value as unknown as T };
      }
    } catch (error: unknown) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error(`Cache.get error [${key}]:`, err);
      return { success: false, error: err };
    }
  }

  async set(key: string, value: any, ttlSeconds: number = this.defaultTTL): Promise<Result<void>> {
    if (!this.isConnected) {
      return { success: false, error: new Error('Cache not connected') };
    }

    try {
      const serializedValue = typeof value === 'string' ? value : JSON.stringify(value);
      await this.client.set(key, serializedValue, 'EX', ttlSeconds);
      return { success: true, data: undefined };
    } catch (error: unknown) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error(`Cache.set error [${key}]:`, err);
      return { success: false, error: err };
    }
  }

  async delete(key: string): Promise<Result<void>> {
    if (!this.isConnected) {
      return { success: false, error: new Error('Cache not connected') };
    }

    try {
      await this.client.del(key);
      return { success: true, data: undefined };
    } catch (error: unknown) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error(`Cache.delete error [${key}]:`, err);
      return { success: false, error: err };
    }
  }

  async exists(key: string): Promise<Result<boolean>> {
    if (!this.isConnected) {
      return { success: false, error: new Error('Cache not connected') };
    }

    try {
      const result = await this.client.exists(key);
      return { success: true, data: result === 1 };
    } catch (error: unknown) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error(`Cache.exists error [${key}]:`, err);
      return { success: false, error: err };
    }
  }

  async mset(keyValuePairs: Record<string, any>, ttlSeconds: number = this.defaultTTL): Promise<Result<void>> {
    if (!this.isConnected) {
      return { success: false, error: new Error('Cache not connected') };
    }

    try {
      const pipeline = this.client.pipeline();
      for (const [key, value] of Object.entries(keyValuePairs)) {
        const serializedValue = typeof value === 'string' ? value : JSON.stringify(value);
        pipeline.set(key, serializedValue, 'EX', ttlSeconds);
      }
      await pipeline.exec();
      return { success: true, data: undefined };
    } catch (error: unknown) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Cache.mset error:', err);
      return { success: false, error: err };
    }
  }

  async increment(key: string, amount: number = 1): Promise<Result<number>> {
    if (!this.isConnected) {
      return { success: false, error: new Error('Cache not connected') };
    }

    try {
      const result = await this.client.incrby(key, amount);
      return { success: true, data: result };
    } catch (error: unknown) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error(`Cache.increment error [${key}]:`, err);
      return { success: false, error: err };
    }
  }

  async expire(key: string, ttlSeconds: number): Promise<Result<boolean>> {
    if (!this.isConnected) {
      return { success: false, error: new Error('Cache not connected') };
    }

    try {
      const result = await this.client.expire(key, ttlSeconds);
      return { success: true, data: result === 1 };
    } catch (error: unknown) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error(`Cache.expire error [${key}]:`, err);
      return { success: false, error: err };
    }
  }

  async ttl(key: string): Promise<Result<number>> {
    if (!this.isConnected) {
      return { success: false, error: new Error('Cache not connected') };
    }

    try {
      const result = await this.client.ttl(key);
      return { success: true, data: result };
    } catch (error: unknown) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error(`Cache.ttl error [${key}]:`, err);
      return { success: false, error: err };
    }
  }

  async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.quit();
      this.isConnected = false;
    }
  }
}

export const cacheService = CacheService.getInstance();
export default cacheService;