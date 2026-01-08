import { z } from 'zod';
import { envSchema, EnvConfig } from '../config/env.schema.js'; // Using .js extension for ESM/TS compatibility if needed, but usually .ts is fine for source. Let's try without .js first or match the project style. The project uses "type": "module" in package.json.
import dotenv from 'dotenv';

// Load .env file
dotenv.config();

export class ConfigService {
  private static instance: ConfigService;
  private config: EnvConfig;

  private constructor() {
    try {
      this.config = envSchema.parse(process.env);
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.error('❌ Invalid environment configuration:', error.format());
        throw error;
      }
      throw error;
    }
  }

  public static getInstance(): ConfigService {
    if (!ConfigService.instance) {
      ConfigService.instance = new ConfigService();
    }
    return ConfigService.instance;
  }

  public static resetInstance(): void {
    ConfigService.instance = (undefined as unknown) as ConfigService;
  }

  public get<K extends keyof EnvConfig>(key: K): EnvConfig[K] {
    return this.config[key];
  }
}
