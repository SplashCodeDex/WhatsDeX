import { describe, it, expect, vi, beforeEach } from 'vitest';
import { cacheService } from './cache.js';
import redis from '../lib/redis.js';

vi.mock('../lib/redis.js', () => ({
  default: {
    get: vi.fn(),
    set: vi.fn(),
    del: vi.fn(),
    exists: vi.fn(),
    on: vi.fn(),
    keys: vi.fn(),
    pipeline: vi.fn(() => ({
      set: vi.fn().mockReturnThis(),
      exec: vi.fn().mockResolvedValue([]),
    })),
  },
}));

describe('CacheService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Force connected state for testing
    (cacheService as any).isConnected = true;
  });

  describe('createKey', () => {
    it('should generate a consistent MD5 hash for the same input', () => {
      const data = { foo: 'bar' };
      const key1 = cacheService.createKey(data);
      const key2 = cacheService.createKey(data);
      expect(key1).toBe(key2);
      expect(key1).toHaveLength(32); // MD5 hex length
    });
  });

  describe('get', () => {
    it('should return a success Result with data when key exists', async () => {
      const mockData = { id: 1, name: 'Test' };
      vi.mocked(redis.get).mockResolvedValue(JSON.stringify(mockData));

      const result = await cacheService.get('test-key');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(mockData);
      }
      expect(redis.get).toHaveBeenCalledWith('test-key');
    });

    it('should return success Result with null when key does not exist', async () => {
      vi.mocked(redis.get).mockResolvedValue(null);

      const result = await cacheService.get('missing-key');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBeNull();
      }
    });
  });

  describe('set', () => {
    it('should return a success Result when set is successful', async () => {
      vi.mocked(redis.set).mockResolvedValue('OK');

      const result = await cacheService.set('key', { val: 1 }, 100);

      expect(result.success).toBe(true);
      expect(redis.set).toHaveBeenCalledWith('key', JSON.stringify({ val: 1 }), 'EX', 100);
    });
  });

  describe('delete', () => {
    it('should return a success Result when del is successful', async () => {
      vi.mocked(redis.del).mockResolvedValue(1);

      const result = await cacheService.delete('key');

      expect(result.success).toBe(true);
      expect(redis.del).toHaveBeenCalledWith('key');
    });
  });

  describe('invalidatePattern', () => {
    it('should delete keys matching pattern', async () => {
      vi.mocked(redis.keys).mockResolvedValue(['key1', 'key2']);
      vi.mocked(redis.del).mockResolvedValue(2);

      const result = await cacheService.invalidatePattern('test:*');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe(2);
      }
      expect(redis.keys).toHaveBeenCalledWith('test:*');
      expect(redis.del).toHaveBeenCalledWith('key1', 'key2');
    });
  });
});
