import configManager, { Config } from '../config/ConfigManager.js';
import logger from '../utils/logger.js';
import { Job } from 'bullmq';

/**
 * Singleton service for managing application configuration.
 * Refactored to wrap ConfigManager for centralized authority.
 */
export class ConfigService {
  private static instance: ConfigService;
  private config: Config;

  private constructor() {
    this.config = configManager.config;
    logger.info('ConfigService initialized as wrapper for ConfigManager');
  }

  public static getInstance(): ConfigService {
    if (!ConfigService.instance) {
      ConfigService.instance = new ConfigService();
    }
    return ConfigService.instance;
  }

  /**
   * Retrieves a configuration value by key.
   * Supports dot notation for nested properties.
   */
  public get(key: string): any {
    return configManager.get(key);
  }

  /**
   * Getter for bot-specific configuration.
   */
  public get bot() {
    return {
      ...this.config.bot,
      jid: '', // Placeholder for dynamic JID
      id: '',   // Alias for jid
      readyAt: new Date(),
      uptime: '0s',
      dbSize: '0B',
      groupLink: this.get('GROUP_LINK') || 'https://chat.whatsapp.com/CodeDeX'
    };
  }

  /**
   * Getter for message/comestics configuration.
   */
  public get msg() {
    return {
      name: this.config.bot.name,
      footer: `© ${new Date().getFullYear()} ${this.config.bot.name}`,
      notFound: '❎ Result not found!',
      readmore: String.fromCharCode(8206).repeat(4001),
      wait: '⏳ Please wait...',
    };
  }

  /**
   * Getter for system-level configuration.
   */
  public get system() {
    return {
      ...this.config.system,
      requireBotGroupMembership: this.get('REQUIRE_BOT_GROUP_MEMBERSHIP'),
      requireGroupSewa: this.get('REQUIRE_GROUP_SEWA'),
      unavailableAtNight: this.get('UNAVAILABLE_AT_NIGHT'),
      privatePremiumOnly: this.get('PRIVATE_PREMIUM_ONLY'),
      restrict: this.get('RESTRICT_COMMANDS'),
      useCoin: this.get('USE_COIN')
    };
  }

  /**
   * Getter for AI-related configuration.
   */
  public get ai() {
    return {
      ...this.config.ai,
      geminiKey: this.config.ai.google.apiKey,
      metaKey: this.get('META_AI_KEY'),
      gemini: {
        model: this.config.ai.google.model,
        generationConfig: {
          temperature: this.config.ai.google.temperature,
          maxOutputTokens: this.config.ai.google.maxTokens,
        }
      },
      memory: {
        maxSize: this.get('AI_MEMORY_MAX_SIZE'),
        ttl: this.get('AI_MEMORY_TTL'),
        cleanupInterval: this.get('AI_MEMORY_CLEANUP_INTERVAL'),
      }
    };
  }

  /**
   * Getter for server-level configuration.
   */
  public get server() {
    return this.config.server;
  }
}

// Export singleton instance and a global config constant
export const configService = ConfigService.getInstance();
export const config = configService; // Alias for easier access
export default configService;
