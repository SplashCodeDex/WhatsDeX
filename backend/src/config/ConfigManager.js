/**
 * Centralized Configuration Manager
 * Fixes scattered environment variables and improves config management
 */

import fs from 'fs';
import path from 'path';

export class ConfigManager {
  constructor() {
    this.config = {};
    this.configPath = process.env.CONFIG_PATH || './config';
    this.environment = process.env.NODE_ENV || 'development';

    this.loadConfiguration();
    this.validateConfiguration();
  }

  loadConfiguration() {
    // Load base configuration
    this.config = {
      // Server Configuration
      server: {
        port: this.getEnvNumber('PORT', 3001),
        host: this.getEnvString('HOST', 'localhost'),
        environment: this.environment,
        maxRequestSize: this.getEnvString('MAX_REQUEST_SIZE', '50mb'),
        cors: {
          origins: this.getEnvArray('CORS_ORIGINS', ['http://localhost:3000']),
          credentials: this.getEnvBoolean('CORS_CREDENTIALS', true)
        }
      },

      // Database Configuration
      database: {
        url: this.getEnvString('DATABASE_URL'),
        maxConnections: this.getEnvNumber('DB_MAX_CONNECTIONS', 20),
        connectionTimeout: this.getEnvNumber('DB_CONNECTION_TIMEOUT', 2000),
        idleTimeout: this.getEnvNumber('DB_IDLE_TIMEOUT', 30000),
        ssl: this.getEnvBoolean('DB_SSL', false)
      },

      // Redis Configuration
      redis: {
        url: this.getEnvString('REDIS_URL'),
        maxRetriesPerRequest: this.getEnvNumber('REDIS_MAX_RETRIES', 3),
        retryDelayOnFailover: this.getEnvNumber('REDIS_RETRY_DELAY', 100),
        family: this.getEnvNumber('REDIS_FAMILY', 4),
        password: this.getEnvString('REDIS_PASSWORD'),
        keyPrefix: this.getEnvString('REDIS_KEY_PREFIX', 'whatsdx:')
      },

      // Authentication & Security
      auth: {
        jwtSecret: this.getEnvString('JWT_SECRET'),
        jwtExpires: this.getEnvString('JWT_EXPIRES_IN', '24h'),
        refreshSecret: this.getEnvString('JWT_REFRESH_SECRET'),
        refreshExpires: this.getEnvString('JWT_REFRESH_EXPIRES_IN', '7d'),
        sessionSecret: this.getEnvString('SESSION_SECRET'),
        sessionMaxAge: this.getEnvNumber('SESSION_MAX_AGE', 86400000),
        bcryptRounds: this.getEnvNumber('BCRYPT_ROUNDS', 12),
        ownerNumber: this.getEnvString('OWNER_NUMBER'),
        adminNumbers: this.getEnvArray('ADMIN_NUMBERS', [])
      },

      // Rate Limiting
      rateLimit: {
        windowMs: this.getEnvNumber('RATE_LIMIT_WINDOW_MS', 900000), // 15 minutes
        maxRequests: this.getEnvNumber('RATE_LIMIT_MAX_REQUESTS', 100),
        skipSuccessfulRequests: this.getEnvBoolean('RATE_LIMIT_SKIP_SUCCESS', false),
        skipFailedRequests: this.getEnvBoolean('RATE_LIMIT_SKIP_FAILED', false)
      },

      // Bot Configuration
      bot: {
        name: this.getEnvString('BOT_NAME', 'WhatsDeX'),
        browser: ['WhatsDeX', 'Chrome', '1.0.0'],
        prefix: this.getEnvArray('BOT_PREFIX', ['.', '!', '/']),
        mode: this.getEnvString('BOT_MODE', 'public'), // public, private
        maxCommandsPerMinute: this.getEnvNumber('BOT_MAX_COMMANDS_PER_MINUTE', 60),
        cooldownMs: this.getEnvNumber('BOT_COOLDOWN_MS', 10000),
        maintenance: this.getEnvBoolean('BOT_MAINTENANCE', false),
        autoReconnect: this.getEnvBoolean('BOT_AUTO_RECONNECT', true),
        sessionPath: this.getEnvString('BOT_SESSION_PATH', './sessions'),
        authAdapter: {
          default: {
            authDir: this.getEnvString('BOT_AUTH_DIR', './auth')
          }
        }
      },

      // AI Services
      ai: {
        google: {
          apiKey: this.getEnvString('GOOGLE_GEMINI_API_KEY'),
          model: this.getEnvString('GOOGLE_GEMINI_MODEL', 'gemini-pro'),
          maxTokens: this.getEnvNumber('GOOGLE_GEMINI_MAX_TOKENS', 2048),
          temperature: this.getEnvNumber('GOOGLE_GEMINI_TEMPERATURE', 0.7)
        },
        openai: {
          apiKey: this.getEnvString('OPENAI_API_KEY'),
          model: this.getEnvString('OPENAI_MODEL', 'gpt-3.5-turbo'),
          maxTokens: this.getEnvNumber('OPENAI_MAX_TOKENS', 1000),
          temperature: this.getEnvNumber('OPENAI_TEMPERATURE', 0.7)
        }
      },

      // Payment Configuration
      payment: {
        stripe: {
          secretKey: this.getEnvString('STRIPE_SECRET_KEY'),
          publishableKey: this.getEnvString('STRIPE_PUBLISHABLE_KEY'),
          webhookSecret: this.getEnvString('STRIPE_WEBHOOK_SECRET'),
          currency: this.getEnvString('STRIPE_CURRENCY', 'USD')
        },
        premium: {
          enabled: this.getEnvBoolean('PREMIUM_ENABLED', true),
          monthlyPrice: this.getEnvNumber('PREMIUM_PRICE_MONTHLY', 4.99),
          yearlyPrice: this.getEnvNumber('PREMIUM_PRICE_YEARLY', 49.99),
          trialDays: this.getEnvNumber('PREMIUM_TRIAL_DAYS', 7)
        }
      },

      // Monitoring & Analytics
      monitoring: {
        enabled: this.getEnvBoolean('ANALYTICS_ENABLED', true),
        metricsPort: this.getEnvNumber('METRICS_PORT', 9090),
        healthCheckEnabled: this.getEnvBoolean('HEALTH_CHECK_ENABLED', true),
        logLevel: this.getEnvString('LOG_LEVEL', 'info'),
        sentryDsn: this.getEnvString('SENTRY_DSN'),
        enablePrometheus: this.getEnvBoolean('ENABLE_PROMETHEUS', false)
      },

      // Feature Flags
      features: {
        aiCommands: this.getEnvBoolean('FEATURE_AI_COMMANDS', true),
        downloadCommands: this.getEnvBoolean('FEATURE_DOWNLOAD_COMMANDS', true),
        gameCommands: this.getEnvBoolean('FEATURE_GAME_COMMANDS', true),
        moderationCommands: this.getEnvBoolean('FEATURE_MODERATION_COMMANDS', true),
        analyticsTracking: this.getEnvBoolean('FEATURE_ANALYTICS_TRACKING', true),
        websocketEnabled: this.getEnvBoolean('FEATURE_WEBSOCKET', true)
      },

      // Memory Management
      memory: {
        maxChatHistory: this.getEnvNumber('MAX_CHAT_HISTORY', 50),
        chatHistoryTTL: this.getEnvNumber('CHAT_HISTORY_TTL', 3600000), // 1 hour
        cacheMaxSize: this.getEnvNumber('CACHE_MAX_SIZE', 1000),
        cleanupInterval: this.getEnvNumber('CLEANUP_INTERVAL', 300000), // 5 minutes
        maxMemoryUsage: this.getEnvNumber('MAX_MEMORY_USAGE', 512) // MB
      }
    };

    // Load environment-specific overrides
    this.loadEnvironmentConfig();
  }

  loadEnvironmentConfig() {
    const envConfigPath = path.join(this.configPath, `${this.environment}.json`);

    if (fs.existsSync(envConfigPath)) {
      try {
        const envConfig = JSON.parse(fs.readFileSync(envConfigPath, 'utf8'));
        this.config = this.mergeDeep(this.config, envConfig);
        console.log(`✅ Loaded ${this.environment} configuration`);
      } catch (error) {
        console.warn(`⚠️ Failed to load ${this.environment} config:`, error.message);
      }
    }
  }

  validateConfiguration() {
    const required = [
      'DATABASE_URL',
      'REDIS_URL',
      'JWT_SECRET',
      'OWNER_NUMBER'
    ];

    const missing = required.filter(key => !process.env[key]);

    if (missing.length > 0) {
      console.error('❌ Missing required environment variables:', missing);
      throw new Error(`Missing required configuration: ${missing.join(', ')}`);
    }

    // Validate JWT secret strength
    if (this.config.auth.jwtSecret.length < 32) {
      console.warn('⚠️ JWT secret is too short. Use at least 32 characters.');
    }

    // Validate database URL format
    if (!this.config.database.url.startsWith('postgresql://')) {
      console.warn('⚠️ Database URL should use postgresql:// protocol');
    }

    console.log('✅ Configuration validation passed');
  }

  getEnvString(key, defaultValue = null) {
    const value = process.env[key];
    if (!value && defaultValue === null) {
      return undefined;
    }
    return value || defaultValue;
  }

  getEnvNumber(key, defaultValue = null) {
    const value = process.env[key];
    if (!value) return defaultValue;
    const parsed = parseInt(value, 10);
    return isNaN(parsed) ? defaultValue : parsed;
  }

  getEnvBoolean(key, defaultValue = false) {
    const value = process.env[key];
    if (!value) return defaultValue;
    return ['true', '1', 'yes', 'on'].includes(value.toLowerCase());
  }

  getEnvArray(key, defaultValue = []) {
    const value = process.env[key];
    if (!value) return defaultValue;
    return value.split(',').map(item => item.trim());
  }

  get(path) {
    return this.getNestedValue(this.config, path);
  }

  set(path, value) {
    this.setNestedValue(this.config, path, value);
  }

  getNestedValue(obj, path) {
    return path.split('.').reduce((current, key) => {
      return current && current[key] !== undefined ? current[key] : undefined;
    }, obj);
  }

  setNestedValue(obj, path, value) {
    const keys = path.split('.');
    const lastKey = keys.pop();
    const target = keys.reduce((current, key) => {
      if (!current[key]) current[key] = {};
      return current[key];
    }, obj);
    target[lastKey] = value;
  }

  mergeDeep(target, source) {
    const result = { ...target };

    for (const key in source) {
      if (source[key] instanceof Object && !Array.isArray(source[key])) {
        result[key] = this.mergeDeep(result[key] || {}, source[key]);
      } else {
        result[key] = source[key];
      }
    }

    return result;
  }

  // Dynamic configuration updates
  updateConfig(path, value) {
    this.set(path, value);
    console.log(`Configuration updated: ${path} = ${value}`);
  }

  // Export configuration for external use
  export() {
    return JSON.parse(JSON.stringify(this.config));
  }

  // Get safe configuration (without sensitive data)
  getSafeConfig() {
    const safe = JSON.parse(JSON.stringify(this.config));

    // Remove sensitive data
    delete safe.auth.jwtSecret;
    delete safe.auth.refreshSecret;
    delete safe.auth.sessionSecret;
    delete safe.ai.google.apiKey;
    delete safe.ai.openai.apiKey;
    delete safe.payment.stripe.secretKey;
    delete safe.payment.stripe.webhookSecret;
    delete safe.monitoring.sentryDsn;

    return safe;
  }
}

// Export singleton instance
const configManager = new ConfigManager();
export default configManager;
