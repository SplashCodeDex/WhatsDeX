/**
 * UNIFIED COMMAND SYSTEM - Consolidates all command loading approaches
 * Combines best features from: tools/cmd.js + CommandRegistry + individual loaders
 * Smart command routing, permissions, and execution
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

// Fixed imports - using existing working modules
import performanceMonitor from '../utils/PerformanceMonitor.js';
import { RateLimiter } from '../utils/RateLimiter.js';
import trackCommandUsage from '../../middleware/analytics.js';
import redisClient from '../../lib/redis.js';
import { levenshteinDistance } from '../utils/levenshtein.js';
import prisma from '../lib/prisma.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class UnifiedCommandSystem {
  constructor(bot, context) {
    this.bot = bot;
    this.context = context;
    this.commands = new Map();
    this.aliases = new Map();
    this.categories = new Map();
    this.rateLimiter = new RateLimiter(redisClient, { limits: this.context.config.rateLimits });
    this.middleware = [];
    
    // Command prefixes
    this.prefixes = ['.', '!', '/', '#'];
    
    this.context.logger.info('🔧 Unified Command System initialized');
  }

  /**
   * LOAD ALL COMMANDS - Consolidates multiple loading approaches
   */
  async loadCommands() {
    const startTime = Date.now();
    this.loadedCount = 0;
    this.failedCount = 0;
    const commandsDir = path.join(__dirname, '..', '..', 'commands');
    let totalCommands = 0;
    
    this.context.logger.info('🔄 Loading unified command system...');
    
    try {
      const categories = await fs.readdir(commandsDir, { withFileTypes: true });
      
      for (const category of categories) {
        if (!category.isDirectory()) continue;
        if (category.isDirectory()) {
          const categoryPath = path.join(commandsDir, category.name);
          const commandFiles = await fs.readdir(categoryPath);
          
          this.context.logger.info(`📂 Loading category: ${category.name}`);
          this.categories.set(category.name, []);
          
          for (const file of commandFiles) {
            totalCommands += 1;
            if (file.endsWith('.js') || file.endsWith('.cjs')) {
              try {
                const commandPath = path.join(categoryPath, file);
                const command = await this.loadSingleCommand(commandPath, category.name);
                
                if (command) {
                  this.registerCommand(command, category.name);
                  this.context.logger.debug(`  ✅ ${command.name} ${command.aliases ? `(${command.aliases.join(', ')})` : ''}`);
                }
              } catch (error) {
                this.context.logger.error(`  ❌ Error loading ${file}:`, { error: error.message });
              }
            }
          }
        }
      }
      
      const duration = Date.now() - startTime;
      this.context.logger.info(`🎉 Loaded ${this.loadedCount + this.failedCount} commands (${this.loadedCount} OK, ${this.failedCount} failed) in ${duration}ms`);
      // Legacy summary for compatibility
      // this.context.logger.info(`🎉 Loaded ${totalCommands} commands across ${this.categories.size} categories`);
      this.context.logger.info(`📊 Command registry size: ${this.commands.size} (including aliases)`);
      
      // Update bot.cmd for compatibility
      this.bot.cmd = this.commands;
      
    } catch (error) {
      this.context.logger.error('❌ Command loading failed:', { error: error.message });
      throw error;
    }
  }

  /**
   * LOAD SINGLE COMMAND - Enhanced command loading with validation and mixed module support
   */
  async loadSingleCommand(commandPath, categoryName) {
    try {
      // Normalize path and ensure it exists
      const absolutePath = path.resolve(commandPath);
      
      // Check if file exists before attempting import
      try {
        await fs.access(absolutePath);
      } catch (accessError) {
        this.context.logger.error(`Command file not found: ${absolutePath}`);
        return null;
      }

      // Enhanced dynamic import with error handling for both ES modules and CommonJS
      let commandModule;
      let command;

      try {
        // Try ES module import first (for .js files in ES module context)
        const commandUrl = pathToFileURL(absolutePath).href;
        commandModule = await import(commandUrl + `?v=${Date.now()}`); // Cache busting
        command = commandModule.default || commandModule;
        
      } catch (esModuleError) {
        this.context.logger.warn(`ES module import failed for ${absolutePath}, trying CommonJS compatibility:`, { error: esModuleError.message });
        
        try {
          // Fallback: Try to handle CommonJS modules through dynamic import
          const commandUrl = pathToFileURL(absolutePath).href;
          commandModule = await import(commandUrl);
          command = commandModule.default || commandModule;
          
          // If still no command, try accessing as CommonJS export pattern
          if (!command && commandModule.module && commandModule.module.exports) {
            command = commandModule.module.exports;
          }
          
        } catch (fallbackError) {
          this.context.logger.error(`Both ES module and CommonJS import failed for ${absolutePath}:`, {
            esError: esModuleError.message,
            cjsError: fallbackError.message
          });
          return null;
        }
      }
      
      if (!this.validateCommand(command)) {
        this.context.logger.warn(`Command validation failed for ${absolutePath}:`, {
          hasCommand: !!command,
          commandType: typeof command,
          hasName: !!(command && command.name),
          hasCode: !!(command && command.code),
          commandKeys: command ? Object.keys(command) : []
        });
        return null;
      }
      
      // Enhance command with metadata
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
        rateLimit: command.rateLimit || { requests: 10, window: 60 },
        middleware: command.middleware || [],
        isEnabled: command.isEnabled !== false
      };

      this.loadedCount += 1;
      this.context.logger.debug(`✅ Successfully loaded command: ${command.name} from ${absolutePath}`);
      return enhancedCommand;
      
    } catch (error) {
      this.failedCount += 1;
      this.context.logger.error(`Failed to load command: ${commandPath}`, {
        error: error.message,
        stack: error.stack,
        commandPath,
        categoryName
      });
      return null;
    }
  }

  /**
   * REGISTER COMMAND - Smart command registration with conflict resolution
   */
  registerCommand(command, categoryName) {
    // Register main command
    if (this.commands.has(command.name)) {
      this.context.logger.warn(`Command name conflict: ${command.name} already exists`);
    }
    
    this.commands.set(command.name, command);
    
    // Register aliases
    if (command.aliases && Array.isArray(command.aliases)) {
      command.aliases.forEach(alias => {
        if (this.commands.has(alias)) {
          this.context.logger.warn(`Alias conflict: ${alias} already exists`);
        }
        
        this.aliases.set(alias, command.name);
        this.commands.set(alias, {
          ...command,
          isAlias: true,
          originalName: command.name
        });
      });
    }
    
    // Add to category
    if (!this.categories.has(categoryName)) {
      this.categories.set(categoryName, []);
    }
    this.categories.get(categoryName).push(command.name);
  }

  /**
   * VALIDATE COMMAND - Comprehensive command validation
   */
  validateCommand(command) {
    if (!command || typeof command !== 'object') {
      this.context.logger.warn('Invalid command: not an object');
      return false;
    }
    
    if (!command.name || typeof command.name !== 'string') {
      this.context.logger.warn('Invalid command: missing or invalid name');
      return false;
    }
    
    if (!command.code || typeof command.code !== 'function') {
      this.context.logger.warn(`Invalid command ${command.name}: missing or invalid code function`);
      return false;
    }
    
    return true;
  }

  /**
   * PROCESS MESSAGE - Smart command detection and execution
   */
  async processMessage(messageData) {
    const text = this.extractText(messageData);
    if (!text) return false;
    
    // Check if message is a command
    const commandInfo = this.parseCommand(text);
    if (!commandInfo) return false;
    
    // Get command
    const command = this.commands.get(commandInfo.name);
    if (!command) {
      // Suggest similar commands
      await this.suggestCommands(messageData, commandInfo.name);
      return true;
    }
    
    // Execute command with full validation
    return await this.executeCommand(command, messageData, commandInfo);
  }

  /**
   * PARSE COMMAND - Smart command parsing
   */
  parseCommand(text) {
    const trimmed = text.trim();
    
    // Check for command prefix
    const hasPrefix = this.prefixes.some(prefix => trimmed.startsWith(prefix));
    if (!hasPrefix) return null;
    
    // Extract command and arguments
    const withoutPrefix = trimmed.substring(1);
    const parts = withoutPrefix.split(/\s+/);
    const name = parts[0].toLowerCase();
    const args = parts.slice(1);
    
    return {
      name,
      args,
      fullText: text,
      prefix: trimmed[0]
    };
  }

  /**
   * EXECUTE COMMAND - Comprehensive command execution with middleware
   */
  async executeCommand(command, messageData, commandInfo) {
    const timer = performanceMonitor.startTimer('command_execution', {
      command: command.name,
      userId: messageData.key.remoteJid,
      category: command.category
    });

    try {
      // Create enhanced context
      const ctx = await this.createContext(messageData, commandInfo, command);
      
      // Apply middleware
      const middlewareResult = await this.applyMiddleware(ctx, command);
      if (!middlewareResult.success) {
        await this.sendMessage(messageData, middlewareResult.message);
        return true;
      }
      
      // Rate limiting
      const userTier = ctx.user?.premium ? 'premium' : 'user';
      const rateLimitResult = await this.rateLimiter.checkCommandRateLimit(
        ctx.sender, 
        command.name,
        userTier
      );
      
      if (!rateLimitResult.allowed) {
        await this.sendMessage(messageData, 
          `⏰ Rate limit exceeded. Try again in ${Math.ceil(rateLimitResult.result.resetTime / 1000)}s`
        );
        return true;
      }
      
      // Track command usage for analytics
      await trackCommandUsage(command.name);

      // Execute command
      await command.code(ctx);
      
      const duration = timer.end();
      this.context.logger.info(`✅ Command executed: ${command.name} (${duration}ms)`, {
        category: command.category,
        argsCount: commandInfo.args.length
      });
      
      return true;
      
    } catch (error) {
      const duration = timer.end();
      this.context.logger.error(`Command execution failed: ${command.name}`, {
        error: error.message,
        userId: messageData.key.remoteJid
      });
      
      await this.sendMessage(messageData, 
        '❌ An error occurred while executing the command. Please try again later.'
      );
      
      return true;
    }
  }

  /**
   * CREATE CONTEXT - Enhanced context creation
   */
  async createContext(messageData, commandInfo, command) {
    const text = this.extractText(messageData);
    const user = await this.context.databaseService.getUser(messageData.key.remoteJid);
    
    return {
      // Message data
      ...messageData,
      body: text,
      args: commandInfo.args,
      command: command,
      prefix: commandInfo.prefix,
      
      // User data
      user: user, // Attach the full user object
      sender: messageData.key.remoteJid,
      pushName: messageData.pushName,
      
      // Bot instance
      bot: this.bot,
      
      // Utility functions
      reply: async (message) => {
        if (typeof message === 'string') {
          return await this.sendMessage(messageData, message);
        } else {
          // Handle object-based messages (media, etc.)
          return await this.bot.sendMessage(messageData.key.remoteJid, message);
        }
      },
      react: async (emoji) => this.reactToMessage(messageData, emoji),
      sendMessage: async (jid, content, options) => {
        try {
          return await this.bot.sendMessage(jid, content, options);
        } catch (error) {
          this.context.logger.error('Failed to send message via ctx.sendMessage:', { error: error.message });
          throw error;
        }
      },
      editMessage: async (key, text) => {
        this.context.logger.warn('⚠️ editMessage not implemented - using reply instead');
        return await this.sendMessage(messageData, text);
      },
      
      // Enhanced features
      isOwner: () => this.isOwner(messageData.key.remoteJid),
      isGroup: () => messageData.key.remoteJid.endsWith('@g.us'),
      timestamp: Date.now(),
      
      // Legacy compatibility properties
      self: this.context || {},
      id: messageData.key.remoteJid,
      used: {
        prefix: commandInfo.prefix,
        command: command.name
      },
      getId: (jid) => {
        // Extract phone number from JID
        return jid.split('@')[0];
      },
    };
  }

  /**
   * APPLY MIDDLEWARE - Command middleware system
   */
  async applyMiddleware(ctx, command) {
    // Global middleware
    for (const middleware of this.middleware) {
      const result = await middleware(ctx, command);
      if (!result.success) {
        return result;
      }
    }
    
    // Command-specific middleware
    if (command.middleware) {
      for (const middleware of command.middleware) {
        const result = await middleware(ctx, command);
        if (!result.success) {
          return result;
        }
      }
    }
    
    return { success: true };
  }

  /**
   * COMMAND SUGGESTIONS - Smart command suggestions
   */
  async suggestCommands(messageData, attemptedCommand) {
    const suggestions = this.findSimilarCommands(attemptedCommand);
    
    if (suggestions.length > 0) {
      const suggestionText = `Command "${attemptedCommand}" not found. Did you mean:\n` +
        suggestions.slice(0, 3).map(cmd => `• ${cmd}`).join('\n');
      
      await this.sendMessage(messageData, suggestionText);
    } else {
      await this.sendMessage(messageData, `Command "${attemptedCommand}" not found. Type .help for available commands.`);
    }
  }

  /**
   * FIND SIMILAR COMMANDS - Levenshtein distance based suggestions
   */
  findSimilarCommands(input) {
    const commandNames = Array.from(this.commands.keys())
      .filter(name => !this.commands.get(name).isAlias);
    
    return commandNames
      .map(name => ({
        name,
        distance: levenshteinDistance(input, name)
      }))
      .filter(item => item.distance <= 2)
      .sort((a, b) => a.distance - b.distance)
      .map(item => item.name);
  }

  /**
   * UTILITY METHODS
   */
  extractText(messageData) {
    if (messageData.message.conversation) {
      return messageData.message.conversation;
    }
    if (messageData.message.extendedTextMessage) {
      return messageData.message.extendedTextMessage.text;
    }
    return '';
  }

  async sendMessage(messageData, text) {
    try {
      await this.bot.sendMessage(messageData.key.remoteJid, { text });
    } catch (error) {
      this.context.logger.error('Failed to send message', { error: error.message });
    }
  }

  async reactToMessage(messageData, emoji) {
    try {
      await this.bot.sendMessage(messageData.key.remoteJid, {
        react: {
          text: emoji,
          key: messageData.key
        }
      });
    } catch (error) {
      this.context.logger.error('Failed to react to message', { error: error.message });
    }
  }

  async isOwnerForInstance(botInstanceId, jid) {
    try {
      if (!botInstanceId || !jid) return false;
      const owner = await prisma.botUser.findUnique({
        where: { botInstanceId_jid: { botInstanceId, jid } },
        select: { role: true }
      });
      if (owner && (owner.role === 'owner' || owner.role === 'admin')) return true;
      // Non-prod fallback
      const configOwner = (this.context?.config?.owner?.id || '').split(',').map(n => n.trim()).filter(Boolean);
      const envOwner = (process.env.OWNER_NUMBER || '').split(',').map(n => n.trim()).filter(Boolean);
      const ownerNumbers = configOwner.length > 0 ? configOwner : envOwner;
      if (ownerNumbers.length > 0 && process.env.NODE_ENV !== 'production') {
        return ownerNumbers.some(ownerNum => jid.includes(ownerNum));
      }
      return false;
    } catch (e) {
      this.context.logger.error('Owner check (scoped) failed', { error: e?.message || String(e) });
      return false;
    }
  }

  async isOwner(jid) {
    try {
      // DB-backed ownership: a user is owner/admin if any BotUser record marks them so
      const owner = await prisma.botUser.findFirst({
        where: { jid, role: { in: ['owner', 'admin'] } },
        select: { id: true }
      });
      if (owner) return true;

      // Backward-compatible fallback (non-prod only)
      const configOwner = (this.context?.config?.owner?.id || '').split(',').map(n => n.trim()).filter(Boolean);
      const envOwner = (process.env.OWNER_NUMBER || '').split(',').map(n => n.trim()).filter(Boolean);
      const ownerNumbers = configOwner.length > 0 ? configOwner : envOwner;
      if (ownerNumbers.length > 0 && process.env.NODE_ENV !== 'production') {
        return ownerNumbers.some(owner => jid.includes(owner));
      }

      if (ownerNumbers.length === 0) {
        this.context.logger.warn('⚠️ No owner configured in DB. Assign an owner by completing WhatsApp pairing.');
      }
      return false;
    } catch (e) {
      this.context.logger.error('Owner check failed', { error: e?.message || String(e) });
      return false;
    }
  }

  /**
   * STATISTICS AND MANAGEMENT
   */
  getStats() {
    return {
      totalCommands: this.commands.size,
      categories: this.categories.size,
      aliases: this.aliases.size,
      commandsByCategory: Object.fromEntries(
        Array.from(this.categories.entries()).map(([cat, cmds]) => [cat, cmds.length])
      )
    };
  }

  getCommand(name) {
    return this.commands.get(name);
  }

  getCommandsByCategory(category) {
    const categoryCommands = this.categories.get(category) || [];
    return categoryCommands.map(name => this.commands.get(name));
  }

  getAllCategories() {
    return Array.from(this.categories.keys());
  }
}

export default UnifiedCommandSystem;