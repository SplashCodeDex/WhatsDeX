import { jest, describe, it, expect, beforeEach, afterAll } from '@jest/globals';
import { ConfigService } from '../ConfigService.js';
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
    process.env.DATABASE_URL = 'postgresql://localhost:5432/test';
    process.env.PORT = '3000';
    process.env.NODE_ENV = 'test';

    const config = ConfigService.getInstance();
    
    expect(config.get('DATABASE_URL')).toBe('postgresql://localhost:5432/test');
    expect(config.get('PORT')).toBe(3000);
    expect(config.get('NODE_ENV')).toBe('test');
  });

  it('should throw error when required variables are missing', () => {
    delete process.env.DATABASE_URL;

    expect(() => {
      ConfigService.getInstance();
    }).toThrow(z.ZodError);
  });

  it('should throw error when variables have invalid formats', () => {
    process.env.PORT = 'invalid-port';

    expect(() => {
      ConfigService.getInstance();
    }).toThrow(z.ZodError);
  });

  it('should return default values for optional variables', () => {
    process.env.DATABASE_URL = 'postgresql://localhost:5432/test';
    delete process.env.PORT; // Should default to 3001 if not set

    const config = ConfigService.getInstance();
    expect(config.get('PORT')).toBe(3001);
  });
});
