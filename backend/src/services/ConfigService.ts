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
    } catch (error: any) {
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

  public get msg() {
    return {
      footer: 'Developed by CodeDeX with ❤', // Hardcoded fallback for now, ideally moved to schema
      banned: '⛔ Cannot process because you have been banned by the Owner!',
      cooldown: '🔄 This command is on cooldown, please wait...',
      gamerestrict: '⛔ Cannot process because this group has restricted games!',
      privatePremiumOnly: '⛔ Using the bot in a private chat is for Premium users only.',
      botGroupMembership: '⛔ Cannot process because you have not joined the bot\'s group!',
      groupSewa: '⛔ The bot is inactive because this group has not been rented.',
      unavailableAtNight: '⛔ The bot is unavailable from 12 AM to 6 AM. Please come back later!',
      admin: '⛔ This command can only be accessed by group admins!',
      botAdmin: '⛔ Cannot process because the bot is not an admin in this group!',
      coin: '⛔ Cannot process because you don\'t have enough coins!',
      group: '⛔ This command can only be accessed within a group!',
      owner: '⛔ This command can only be accessed by the Owner!',
      premium: '⛔ Cannot process because you are not a Premium user!',
      private: '⛔ This command can only be accessed in a private chat!',
      restrict: '⛔ This command has been restricted for security reasons!'
    };
  }

  public get system() {
    return {
      autoTypingOnCmd: true,
      cooldown: this.get('BOT_COOLDOWN_MS'),
      requireBotGroupMembership: this.get('REQUIRE_BOT_GROUP_MEMBERSHIP'),
      requireGroupSewa: this.get('REQUIRE_GROUP_SEWA'),
      unavailableAtNight: this.get('UNAVAILABLE_AT_NIGHT'),
      timeZone: this.get('TIME_ZONE'),
      privatePremiumOnly: this.get('PRIVATE_PREMIUM_ONLY'),
      restrict: this.get('RESTRICT_COMMANDS'),
      useCoin: this.get('USE_COIN')
    };
  }

  public get ai() {
    return {
      geminiKey: this.get('GOOGLE_GEMINI_API_KEY'),
      metaKey: this.get('META_AI_KEY'),
      summarization: {
        threshold: this.get('AI_SUMMARIZE_THRESHOLD'),
        messagesToSummarize: this.get('AI_MESSAGES_TO_SUMMARIZE'),
        historyPruneLength: this.get('AI_HISTORY_PRUNE_LENGTH')
      }
    };
  }

  public get bot() {
    return {
      groupJid: this.get('GROUP_JID'),
      jid: '' // Placeholder
    };
  }
}
