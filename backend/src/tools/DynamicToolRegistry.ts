import { promises as fs } from 'fs';
import path from 'path';
import logger from '../utils/logger.js';

/**
 * Dynamic Tool Registry - Converts all bot commands into AI-accessible tools
 * Enables the AI to use any command through natural language
 */
export class DynamicToolRegistry {
  private bot: any;
  private tools: Map<string, any>;
  private categories: Map<string, any>;
  private toolSchemas: any[];

  constructor(bot) {
    this.bot = bot;
    this.tools = new Map();
    this.categories = new Map();
    this.toolSchemas = [];

    logger.info('Initializing Dynamic Tool Registry');
  }

  /**
   * Register all bot commands as AI tools
   */
  async registerAllCommands() {
    let registered = 0;

    for (const [commandName, command] of this.bot.cmd) {
      try {
        const toolSchema = await this.createToolSchema(commandName, command);
        if (toolSchema) {
          this.tools.set(commandName, {
            name: commandName,
            command,
            schema: toolSchema,
            category: command.category || 'misc',
            enabled: true,
            usage: command.usage || '',
            description: command.description || `Execute ${commandName} command`
          });

          this.toolSchemas.push(toolSchema);
          registered++;
        }
      } catch (error: any) {
        logger.warn(`Failed to register command as tool: ${commandName}`, error.message);
      }
    }

    this.categorizeTools();
    logger.info(`Registered ${registered} commands as AI tools`);

    return registered;
  }

  /**
   * Create AI tool schema from command definition
   */
  async createToolSchema(commandName, command) {
    const category = command.category || 'misc';

    // Generate intelligent description based on command category and name
    const description = this.generateSmartDescription(commandName, category, command);

    // Infer parameters from command
    const parameters = await this.inferParameters(commandName, category, command);

    return {
      type: 'function',
      function: {
        name: commandName,
        description,
        parameters: {
          type: 'object',
          properties: parameters.properties,
          required: parameters.required || []
        }
      }
    };
  }

  /**
   * Generate intelligent descriptions for commands
   */
  generateSmartDescription(commandName, category, command) {
    if (command.description) {
      return command.description;
    }

    const descriptions = {
      // AI Commands
      'gemini': 'Chat with Gemini AI assistant - can have conversations and use other tools',
      'dalle': 'Generate images using DALL-E AI from text descriptions',
      'animagine': 'Create anime-style images from text prompts',
      'upscale': 'Enhance and upscale image quality using AI',
      'editimage': 'Edit and modify images using AI',

      // Download Commands
      'youtubevideo': 'Download videos from YouTube using URL or search term',
      'youtubeaudio': 'Download audio/music from YouTube',
      'instagramdl': 'Download content from Instagram posts, reels, stories',
      'tiktokdl': 'Download TikTok videos without watermark',
      'facebookdl': 'Download videos from Facebook',
      'twitterdl': 'Download videos and images from Twitter/X',
      'spotifydl': 'Download music from Spotify',

      // Search Commands
      'googlesearch': 'Search Google for information on any topic',
      'youtubesearch': 'Search for videos on YouTube',
      'githubsearch': 'Search for code repositories on GitHub',
      'npmsearch': 'Search for Node.js packages on NPM',

      // Utility Commands
      'weather': 'Get current weather and forecast for any location',
      'translate': 'Translate text between different languages',
      'screenshot': 'Take a screenshot of any website',
      'ocr': 'Extract text from images using OCR',
      'removebg': 'Remove background from images',

      // Entertainment Commands
      'joke': 'Tell random jokes and funny content',
      'meme': 'Generate or find funny memes',
      'quotes': 'Share inspirational or famous quotes',
      'tebakgambar': 'Play picture guessing game',
      'family100': 'Play Family Feud style quiz game',

      // Conversion Commands
      'toaudio': 'Convert video files to audio format',
      'tovideo': 'Convert media to video format',
      'toimage': 'Extract images from video or convert formats',
      'togif': 'Convert videos to animated GIF',

      // Information Commands
      'ping': 'Check bot response time and status',
      'uptime': 'Show how long the bot has been running',
      'about': 'Get information about the bot',
      'menu': 'Show all available commands and features'
    };

    if (descriptions[commandName]) {
      return descriptions[commandName];
    }

    // Generate description based on category
    const categoryDescriptions = {
      'ai-chat': `AI-powered chat command: ${commandName}`,
      'ai-image': `AI image generation/editing: ${commandName}`,
      'downloader': `Download content from various platforms: ${commandName}`,
      'search': `Search for information using: ${commandName}`,
      'converter': `Convert media formats using: ${commandName}`,
      'entertainment': `Entertainment and fun: ${commandName}`,
      'tool': `Utility tool: ${commandName}`,
      'game': `Interactive game: ${commandName}`,
      'information': `Get information using: ${commandName}`,
      'group': `Group management: ${commandName}`,
      'owner': `Bot administration: ${commandName}`,
      'profile': `User profile management: ${commandName}`
    };

    return categoryDescriptions[category] || `Execute ${commandName} command`;
  }

  /**
   * Infer parameters from command
   */
  async inferParameters(commandName, category, command) {
    const parameters = { properties: {}, required: [] };

    // Common parameter patterns based on command name and category
    const parameterPatterns = {
      // Download commands typically need URL or search query
      download: {
        url: {
          type: 'string',
          description: 'URL of the content to download or search term'
        }
      },

      // Search commands need query
      search: {
        query: {
          type: 'string',
          description: 'Search query or keywords'
        }
      },

      // AI image commands need prompt
      image: {
        prompt: {
          type: 'string',
          description: 'Text description of the image to generate'
        }
      },

      // Translation needs text and target language
      translate: {
        text: {
          type: 'string',
          description: 'Text to translate'
        },
        to: {
          type: 'string',
          description: 'Target language code (e.g., en, es, fr, id)'
        }
      },

      // Weather needs location
      weather: {
        location: {
          type: 'string',
          description: 'City name or location for weather information'
        }
      },

      // Screenshot needs URL
      screenshot: {
        url: {
          type: 'string',
          description: 'Website URL to take screenshot of'
        }
      }
    };

    // Apply patterns based on command characteristics
    if (commandName.includes('dl') || commandName.includes('download') || category === 'downloader') {
      Object.assign(parameters.properties, parameterPatterns.download);
      parameters.required.push('url');
    } else if (commandName.includes('search') || category === 'search') {
      Object.assign(parameters.properties, parameterPatterns.search);
      parameters.required.push('query');
    } else if (category === 'ai-image' || commandName.includes('image') || commandName.includes('generate')) {
      Object.assign(parameters.properties, parameterPatterns.image);
      parameters.required.push('prompt');
    } else if (commandName === 'translate') {
      Object.assign(parameters.properties, parameterPatterns.translate);
      parameters.required.push('text', 'to');
    } else if (commandName === 'weather') {
      Object.assign(parameters.properties, parameterPatterns.weather);
      parameters.required.push('location');
    } else if (commandName === 'screenshot') {
      Object.assign(parameters.properties, parameterPatterns.screenshot);
      parameters.required.push('url');
    } else {
      // Generic input parameter for other commands
      parameters.properties.input = {
        type: 'string',
        description: 'Input text or parameters for the command'
      };
    }

    return parameters;
  }

  /**
   * Categorize tools for better organization
   */
  categorizeTools() {
    for (const [name, tool] of this.tools) {
      const category = tool.category;
      if (!this.categories.has(category)) {
        this.categories.set(category, []);
      }
      this.categories.get(category).push(name);
    }
  }

  /**
   * Get tool schemas for AI
   */
  getToolSchemas() {
    return this.toolSchemas.filter(schema => {
      const toolName = schema.function.name;
      const tool = this.tools.get(toolName);
      return tool && tool.enabled;
    });
  }

  /**
   * Get tools by category
   */
  getToolsByCategory(category) {
    return this.categories.get(category) || [];
  }

  /**
   * Get tool information
   */
  getToolInfo(toolName) {
    return this.tools.get(toolName);
  }

  /**
   * Enable/disable specific tools
   */
  setToolEnabled(toolName, enabled) {
    const tool = this.tools.get(toolName);
    if (tool) {
      tool.enabled = enabled;
      logger.info(`Tool ${toolName} ${enabled ? 'enabled' : 'disabled'}`);
    }
  }

  /**
   * Get registry statistics
   */
  getStats() {
    const stats = {
      totalTools: this.tools.size,
      enabledTools: 0,
      categories: {},
      toolsByCategory: {}
    };

    for (const [name, tool] of this.tools) {
      if (tool.enabled) stats.enabledTools++;

      const category = tool.category;
      stats.categories[category] = (stats.categories[category] || 0) + 1;

      if (!stats.toolsByCategory[category]) {
        stats.toolsByCategory[category] = [];
      }
      stats.toolsByCategory[category].push(name);
    }

    return stats;
  }

  /**
   * Export tool registry for backup
   */
  async exportRegistry() {
    const exportData = {
      timestamp: new Date().toISOString(),
      tools: Array.from(this.tools.entries()),
      categories: Array.from(this.categories.entries()),
      schemas: this.toolSchemas
    };

    return exportData;
  }

  /**
   * Health check
   */
  async healthCheck() {
    try {
      const stats = this.getStats();
      return {
        status: 'healthy',
        ...stats,
        timestamp: new Date().toISOString()
      };
    } catch (error: any) {
      return {
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }
}

export default DynamicToolRegistry;
