/**
 * UNIFIED COMMAND SYSTEM - Consolidates all command loading approaches
 * Combines best features from: tools/cmd.js + CommandRegistry + individual loaders
 * Smart command routing, permissions, and execution
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
// Fixed imports - using existing working modules
import performanceMonitor from '../utils/PerformanceMonitor.js';
import { RateLimiter } from '../utils/RateLimiter.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class UnifiedCommandSystem {
  constructor(bot, context) {
    this.bot = bot;
    this.context = context;
    this.commands = new Map();
    this.aliases = new Map();
    this.categories = new Map();
    this.rateLimiter = new RateLimiter();
    this.middleware = [];
    
    // Command prefixes
    this.prefixes = ['.', '!', '/', '#'];
    
    console.log('🔧 Unified Command System initialized');
  }

  /**
   * LOAD ALL COMMANDS - Consolidates multiple loading approaches
   */
  async loadCommands() {
    const commandsDir = path.join(__dirname, '..', '..', 'commands');
    let totalCommands = 0;
    
    console.log('🔄 Loading unified command system...');
    
    try {
      const categories = await fs.readdir(commandsDir, { withFileTypes: true });
      
      for (const category of categories) {
        if (category.isDirectory()) {
          const categoryPath = path.join(commandsDir, category.name);
          const commandFiles = await fs.readdir(categoryPath);
          
          console.log(`📂 Loading category: ${category.name}`);
          this.categories.set(category.name, []);
          
          for (const file of commandFiles) {
            if (file.endsWith('.js')) {
              try {
                const commandPath = path.join(categoryPath, file);
                const command = await this.loadSingleCommand(commandPath, category.name);
                
                if (command) {
                  this.registerCommand(command, category.name);
                  totalCommands++;
                  console.log(`  ✅ ${command.name} ${command.aliases ? `(${command.aliases.join(', ')})` : ''}`);
                }
              } catch (error) {
                console.error(`  ❌ Error loading ${file}:`, error.message);
              }
            }
          }
        }
      }
      
      console.log(`🎉 Loaded ${totalCommands} commands across ${this.categories.size} categories`);
      console.log(`📊 Command registry size: ${this.commands.size} (including aliases)`);
      
      // Update bot.cmd for compatibility
      this.bot.cmd = this.commands;
      
    } catch (error) {
      console.error('❌ Command loading failed:', error.message);
      throw error;
    }
  }

  /**
   * LOAD SINGLE COMMAND - Enhanced command loading with validation
   */
  async loadSingleCommand(commandPath, categoryName) {
    try {
      const relativePath = path.relative(__dirname, commandPath);
      const commandModule = await import(`../../${relativePath}`);
      const command = commandModule.default;
      
      if (!this.validateCommand(command)) {
        return null;
      }
      
      // Enhance command with metadata
      return {
        ...command,
        category: categoryName,
        filePath: relativePath,
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
      
    } catch (error) {
      console.error(`Failed to load command: ${commandPath}`, error.message);
      return null;
    }
  }

  /**
   * REGISTER COMMAND - Smart command registration with conflict resolution
   */
  registerCommand(command, categoryName) {
    // Register main command
    if (this.commands.has(command.name)) {
      console.warn(`Command name conflict: ${command.name} already exists`);
    }
    
    this.commands.set(command.name, command);
    
    // Register aliases
    if (command.aliases && Array.isArray(command.aliases)) {
      command.aliases.forEach(alias => {
        if (this.commands.has(alias)) {
          console.warn(`Alias conflict: ${alias} already exists`);
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
      console.warn('Invalid command: not an object');
      return false;
    }
    
    if (!command.name || typeof command.name !== 'string') {
      console.warn('Invalid command: missing or invalid name');
      return false;
    }
    
    if (!command.code || typeof command.code !== 'function') {
      console.warn(`Invalid command ${command.name}: missing or invalid code function`);
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
      const rateLimitResult = await this.rateLimiter.checkCommandRateLimit(
        ctx.sender, 
        command.name
      );
      
      if (!rateLimitResult.allowed) {
        await this.sendMessage(messageData, 
          `⏰ Rate limit exceeded. Try again in ${Math.ceil(rateLimitResult.result.resetTime / 1000)}s`
        );
        return true;
      }
      
      // Execute command
      await command.code(ctx);
      
      const duration = timer.end();
      console.log(`✅ Command executed: ${command.name} (${duration}ms)`, {
        category: command.category,
        argsCount: commandInfo.args.length
      });
      
      return true;
      
    } catch (error) {
      const duration = timer.end();
      console.error(`Command execution failed: ${command.name}`, {
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
    
    return {
      // Message data
      ...messageData,
      body: text,
      args: commandInfo.args,
      command: command,
      prefix: commandInfo.prefix,
      
      // User data
      sender: messageData.key.remoteJid,
      pushName: messageData.pushName,
      
      // Bot instance
      bot: this.bot,
      
      // Utility functions
      reply: async (message) => this.sendMessage(messageData, message),
      react: async (emoji) => this.reactToMessage(messageData, emoji),
      
      // Enhanced features
      isOwner: () => this.isOwner(messageData.key.remoteJid),
      isGroup: () => messageData.key.remoteJid.endsWith('@g.us'),
      timestamp: Date.now()
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
        distance: this.levenshteinDistance(input, name)
      }))
      .filter(item => item.distance <= 2)
      .sort((a, b) => a.distance - b.distance)
      .map(item => item.name);
  }

  levenshteinDistance(str1, str2) {
    const matrix = [];
    
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }
    
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }
    
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    
    return matrix[str2.length][str1.length];
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
      console.error('Failed to send message', error.message);
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
      console.error('Failed to react to message', error.message);
    }
  }

  isOwner(jid) {
    const ownerNumbers = (process.env.OWNER_NUMBER || '').split(',').map(n => n.trim());
    return ownerNumbers.some(owner => jid.includes(owner));
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