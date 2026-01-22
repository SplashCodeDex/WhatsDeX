import { describe, it, expect, beforeEach, afterAll, vi } from 'vitest';
import { ConfigService } from '@/services/ConfigService.js';
import { z } from 'zod';

describe('ConfigService', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    ConfigService.resetInstance();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('should validate and load valid configuration', () => {
    process.env.PORT = '3000';
    process.env.NODE_ENV = 'test';

    const config = ConfigService.getInstance();

    expect(config.get('PORT')).toBe(3000);
    expect(config.get('NODE_ENV')).toBe('test');
  });

  it('should throw error when configuration is invalid', () => {
    // NODE_ENV is enum ['development', 'production', 'test']
    process.env.NODE_ENV = 'invalid_env' as any;

    expect(() => {
      ConfigService.getInstance();
    }).toThrow(z.ZodError);
  });

  it('should return default values for optional variables', () => {
    delete process.env.PORT; // Should default to 3001 if not set

    const config = ConfigService.getInstance();
    expect(config.get('PORT')).toBe(3001);
  });

  it('should load environment variables correctly', () => {
    // Set specific values for this test
    process.env.REDIS_HOST = 'redis-server';
    process.env.CONN_MAX_RETRIES = '20';
    process.env.GEMINI_MODEL = 'gemini-2.5-flash';

    // Reset instance to pick up new process.env
    ConfigService.resetInstance();
    const config = ConfigService.getInstance();

    expect(config.get('REDIS_HOST')).toBe('redis-server');
    expect(config.get('CONN_MAX_RETRIES')).toBe(20);
    expect(config.get('GEMINI_MODEL')).toBe('gemini-2.5-flash');

    // Verify system/ai objects still work for infrastructure
    expect(config.ai.gemini.model).toBe('gemini-2.5-flash');
  });
});
