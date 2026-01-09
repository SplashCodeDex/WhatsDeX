/**
 * UNIFIED COMMAND SYSTEM - Consolidates all command loading approaches
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

import performanceMonitor from '../utils/performanceMonitor.js';
import logger from '../utils/logger.js';
import { Bot, GlobalContext, Command } from '../types/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class CommandSystem {
  private bot: Bot;
  private context: GlobalContext;
  private commands: Map<string, Command>;
  private aliases: Map<string, string>;
  private categories: Map<string, string[]>;
  private middleware: any[];
  private prefixes: string[];
  private loadedCount: number = 0;
  private failedCount: number = 0;

  constructor(bot: any, context: any) {
    this.bot = bot;
    this.context = context;
    this.commands = new Map();
    this.aliases = new Map();
    this.categories = new Map();
    this.middleware = [];

    // Command prefixes
    this.prefixes = ['.', '!', '/', '#'];

    this.context.logger.info('🔧 Unified Command System initialized');
  }

  /**
   * LOAD ALL COMMANDS
   */
  async loadCommands() {
    const startTime = Date.now();
    this.loadedCount = 0;
    this.failedCount = 0;

    this.commands.clear();
    this.aliases.clear();
    this.categories.clear();

    const commandsDir = path.join(__dirname, '..', '..', 'commands');

    this.context.logger.info('🔄 Loading commands...');

    try {
      const categories = await fs.readdir(commandsDir, { withFileTypes: true });

      for (const category of categories) {
        if (!category.isDirectory()) continue;

        const categoryPath = path.join(commandsDir, category.name);
        const commandFiles = await fs.readdir(categoryPath);

        this.categories.set(category.name, []);

        for (const file of commandFiles) {
          if (file.endsWith('.js') || file.endsWith('.cjs')) {
            try {
              const commandPath = path.join(categoryPath, file);
              const command = await this.loadSingleCommand(commandPath, category.name);

              if (command) {
                this.registerCommand(command, category.name);
              }
            } catch (error: any) {
              this.context.logger.error(`  ❌ Error loading ${file}:`, { error: error.message });
            }
          }
        }
      }

      const duration = Date.now() - startTime;
      this.context.logger.info(`🎉 Loaded ${this.loadedCount} commands in ${duration}ms`);

      // Update bot.cmd for compatibility
      if (this.bot) this.bot.cmd = this.commands;

    } catch (error: any) {
      this.context.logger.error('❌ Command loading failed:', { error: error.message });
      // throw error; // Don't crash if commands fail to load
    }
  }

  /**
   * LOAD SINGLE COMMAND
   */
  async loadSingleCommand(commandPath, categoryName) {
    try {
      const absolutePath = path.resolve(commandPath);
      const commandUrl = pathToFileURL(absolutePath).href;

      const commandModule = await import(commandUrl + `?v=${Date.now()}`);
      const command = commandModule.default || commandModule;

      if (command) {
        if (command.execute && !command.code) command.code = command.execute;
        else if (command.run && !command.code) command.code = command.run;
      }

      if (!this.validateCommand(command)) return null;

      const enhancedCommand = {
        ...command,
        category: categoryName,
        filePath: commandPath,
        loadedAt: Date.now(),
        aliases: command.aliases || [],
        permissions: command.permissions || {},
        cooldown: command.cooldown || 0,
        description: command.description || 'No description',
        usage: command.usage || `${command.name}`,
        isEnabled: command.isEnabled !== false
      };

      this.loadedCount += 1;
      return enhancedCommand;

    } catch (error: any) {
      this.failedCount += 1;
      this.context.logger.error(`Failed to load command: ${commandPath}`, { error: error.message });
      return null;
    }
  }

  registerCommand(command: any, categoryName: string) {
    this.commands.set(command.name, command);
    if (command.aliases) {
      command.aliases.forEach((alias: string) => {
        this.aliases.set(alias, command.name);
        this.commands.set(alias, { ...command, isAlias: true, originalName: command.name });
      });
    }
    if (!this.categories.has(categoryName)) this.categories.set(categoryName, []);
    this.categories.get(categoryName)?.push(command.name);
  }

  validateCommand(command: any) {
    return command && typeof command === 'object' && command.name && typeof command.code === 'function';
  }

  async processMessage(messageData: any) {
    const text = this.extractText(messageData);
    if (!text) return false;

    const commandInfo = this.parseCommand(text);
    if (!commandInfo) return false;

    const command = this.commands.get(commandInfo.name);
    if (!command) {
      await this.suggestCommands(messageData, commandInfo.name);
      return true;
    }

    return await this.executeCommand(command, messageData, commandInfo);
  }

  parseCommand(text: string) {
    const trimmed = text.trim();
    const prefix = this.prefixes.find(p => trimmed.startsWith(p));
    if (!prefix) return null;

    const withoutPrefix = trimmed.substring(prefix.length);
    const parts = withoutPrefix.split(/\s+/);
    const name = parts[0].toLowerCase();
    const args = parts.slice(1);

    return { name, args, fullText: text, prefix };
  }

  async executeCommand(command: any, messageData: any, commandInfo: any) {
    const timer = performanceMonitor.startTimer('command_execution', {
      command: command.name,
      userId: messageData.key.remoteJid
    });

    try {
      const ctx = await this.createContext(messageData, commandInfo, command);

      // Placeholder for rate limiting (no Redis)
      // Logic for rate limiting will be moved to Firebase/Global state

      await command.code(ctx);

      const duration = timer.end();
      this.context.logger.info(`✅ Command executed: ${command.name} (${duration}ms)`);

      // 🔥 Firebase recordCommandUsage placeholder
      return true;

    } catch (error: any) {
      timer.end();
      this.context.logger.error(`Command execution failed: ${command.name}`, { error: error.message });
      await this.sendMessage(messageData, '❌ An error occurred while executing the command.');
      return true;
    }
  }

  async createContext(messageData: any, commandInfo: any, command: any) {
    const text = this.extractText(messageData);
    return {
      ...messageData,
      body: text,
      args: commandInfo.args,
      command: command,
      prefix: commandInfo.prefix,
      sender: {
        jid: messageData.key.remoteJid,
        name: messageData.pushName || 'Unknown',
        isOwner: false, // Todo: implement check
        isAdmin: false, // Todo: implement check
      },
      pushName: messageData.pushName,
      bot: this.bot,
      reply: async (msg: any) => {
        const content = typeof msg === 'string' ? { text: msg } : msg;
        return await this.bot.sendMessage(messageData.key.remoteJid, content, { quoted: messageData });
      },
      id: messageData.key.remoteJid,
      isGroup: () => messageData.key.remoteJid.endsWith('@g.us'),
      usage: {},
      config: this.context.config,
      // Add other missing properties as needed or allow loose typing for now via simple cast if complexity is too high
    } as any;
  }

  async suggestCommands(messageData: any, attemptedCommand: string) {
    // Simple suggestion placeholder
    await this.sendMessage(messageData, `Command "${attemptedCommand}" not found.`);
  }

  extractText(messageData: any) {
    return messageData.message?.conversation || messageData.message?.extendedTextMessage?.text || '';
  }

  async sendMessage(messageData: any, text: string) {
    try {
      if (this.bot) await this.bot.sendMessage(messageData.key.remoteJid, { text });
    } catch (error: any) {
      this.context.logger.error('Failed to send message', { error: error.message });
    }
  }
}

export default CommandSystem;
