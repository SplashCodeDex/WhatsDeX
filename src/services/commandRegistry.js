const logger = require('../utils/logger');

class CommandRegistry {
  constructor() {
    this.commands = new Map();
    this.rateLimiter = null;
    this.cache = null;

    // Initialize rate limiter if available
    try {
      const RateLimiterService = require('./rateLimiter');
      this.rateLimiter = new RateLimiterService();
    } catch (error) {
      logger.warn('Rate limiter not available, proceeding without rate limiting');
    }

    // Initialize cache if available
    try {
      const CacheService = require('./cache');
      this.cache = new CacheService();
    } catch (error) {
      logger.warn('Cache service not available, proceeding without caching');
    }
  }

  /**
   * Register a new command
   * @param {Object} command - Command definition
   */
  register(command) {
    if (!command.name || !command.execute) {
      throw new Error('Command must have name and execute function');
    }

    this.commands.set(command.name, {
      name: command.name,
      category: command.category || 'misc',
      description: command.description || '',
      usage: command.usage || '',
      rateLimit: command.rateLimit || { maxCalls: 10, windowMs: 60000 },
      permissions: command.permissions || [],
      execute: command.execute
    });

    logger.info(`Registered command: ${command.name}`);
  }

  /**
   * Execute a command with rate limiting and caching
   * @param {string} commandName - Name of the command
   * @param {Object} context - Command execution context
   * @returns {Promise<Object>} Command result
   */
  async execute(commandName, context) {
    const command = this.commands.get(commandName);
    if (!command) {
      throw new Error(`Command not found: ${commandName}`);
    }

    // Rate limiting check
    if (this.rateLimiter && command.rateLimit) {
      const allowed = await this.rateLimiter.check(
        `${context.userId}:${commandName}`,
        command.rateLimit
      );
      if (!allowed) {
        throw new Error('Rate limit exceeded. Please try again later.');
      }
    }

    // Execute with timeout
    try {
      const result = await Promise.race([
        command.execute(context),
        this.timeout(30000, `Command ${commandName} timeout`)
      ]);

      return {
        success: true,
        command: commandName,
        result,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      logger.error(`Command execution failed: ${commandName}`, {
        error: error.message,
        userId: context.userId
      });

      return {
        success: false,
        command: commandName,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Get all registered commands
   * @returns {Array} Array of command definitions
   */
  getAllCommands() {
    return Array.from(this.commands.values());
  }

  /**
   * Get commands by category
   * @param {string} category - Category to filter by
   * @returns {Array} Array of commands in the category
   */
  getCommandsByCategory(category) {
    return Array.from(this.commands.values()).filter(cmd => cmd.category === category);
  }

  /**
   * Check if a command exists
   * @param {string} commandName - Name of the command
   * @returns {boolean} Whether the command exists
   */
  hasCommand(commandName) {
    return this.commands.has(commandName);
  }

  /**
   * Get command definition
   * @param {string} commandName - Name of the command
   * @returns {Object|null} Command definition or null if not found
   */
  getCommand(commandName) {
    return this.commands.get(commandName) || null;
  }

  /**
   * Remove a command
   * @param {string} commandName - Name of the command to remove
   * @returns {boolean} Whether the command was removed
   */
  removeCommand(commandName) {
    const removed = this.commands.delete(commandName);
    if (removed) {
      logger.info(`Removed command: ${commandName}`);
    }
    return removed;
  }

  /**
   * Utility function for timeout
   * @param {number} ms - Milliseconds to wait
   * @param {string} message - Timeout message
   * @returns {Promise} Promise that rejects after timeout
   */
  timeout(ms, message) {
    return new Promise((_, reject) => {
      setTimeout(() => reject(new Error(message)), ms);
    });
  }

  /**
   * Get registry statistics
   * @returns {Object} Statistics about the registry
   */
  getStats() {
    const commands = Array.from(this.commands.values());
    const categories = {};

    commands.forEach(cmd => {
      categories[cmd.category] = (categories[cmd.category] || 0) + 1;
    });

    return {
      totalCommands: commands.length,
      categories,
      rateLimiterEnabled: !!this.rateLimiter,
      cacheEnabled: !!this.cache
    };
  }
}

module.exports = CommandRegistry;