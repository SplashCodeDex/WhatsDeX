const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const GeminiService = require('../../services/gemini');
const logger = require('../utils/logger');

class CommandSuggestionsService {
  constructor() {
    this.gemini = new GeminiService();
    this.commandCategories = {};
    this.commandDescriptions = {};
    this.initialize();
  }

  async initialize() {
    await this.loadCommandConfig();
    logger.info('Command Suggestions service initialized with dynamic configuration');
  }

  async loadCommandConfig() {
    const configs = await prisma.nlpConfig.findMany({
        where: {
            OR: [
                { type: 'command_category' },
                { type: 'command_description' },
            ],
        },
    });

    for (const config of configs) {
        if (config.type === 'command_category') {
            this.commandCategories[config.key] = config.value;
        } else if (config.type === 'command_description') {
            this.commandDescriptions[config.key] = config.value;
        }
    }
  }

  async suggestCommands(userInput, userId) {
    if (!userInput || userInput.trim().length < 2) {
      return this.getPopularCommands();
    }

    try {
      const recentCommands = await this.getUserCommandHistory(userId);
      const context = this._buildAnalysisContext(userInput, recentCommands);
      const suggestions = await this._analyzeWithGemini(context);
      return this._rankSuggestions(suggestions, userInput, recentCommands);
    } catch (error) {
      logger.error('Error generating command suggestions', { error: error.message });
      return this.fallbackSuggestions(userInput);
    }
  }

  async getUserCommandHistory(userId) {
    const recentUsages = await prisma.commandUsage.findMany({
        where: { userId },
        orderBy: { usedAt: 'desc' },
        take: 5,
        distinct: ['command'],
    });
    return recentUsages.map(usage => usage.command);
  }

  _buildAnalysisContext(userInput, recentCommands) {
    return `Analyze this user message and suggest relevant WhatsApp bot commands.
User Message: "${userInput}"
Recent Commands: ${recentCommands.join(', ') || 'none'}
Available Categories: ${Object.keys(this.commandCategories).join(', ')}
Respond with a JSON array of suggestions: [{"command": "name", "category": "cat", "confidence": 0.8, "reason": "why"}]`;
  }

  async _analyzeWithGemini(context) {
    try {
        const response = await this.gemini.getChatCompletion(context);
        const cleanedResponse = response.trim().replace(/^```json\s*/, '').replace(/\s*```$/, '');
        return JSON.parse(cleanedResponse);
    } catch (error) {
        logger.warn('Failed to parse Gemini suggestions', { error: error.message });
        return [];
    }
  }

  _rankSuggestions(suggestions, userInput, recentCommands) {
    const ranked = suggestions.map(suggestion => {
        let score = suggestion.confidence || 0.5;
        if (recentCommands.includes(suggestion.command)) {
            score += 0.2;
        }
        return { ...suggestion, score };
    });
    return ranked.sort((a, b) => b.score - a.score).slice(0, 5);
  }

  fallbackSuggestions(userInput) {
    const suggestions = [];
    const input = userInput.toLowerCase();
    for (const [category, commands] of Object.entries(this.commandCategories)) {
        if (commands.some(cmd => input.includes(cmd))) {
            suggestions.push({
                command: commands[0],
                category,
                confidence: 0.7,
                reason: 'Keyword match',
            });
        }
    }
    return suggestions.slice(0, 3);
  }

  getPopularCommands() {
    // This could be enhanced with real analytics data
    return [
      { command: 'gemini', category: 'ai', confidence: 0.9, reason: 'Popular AI command' },
      { command: 'sticker', category: 'converter', confidence: 0.8, reason: 'Popular utility' },
    ];
  }
}

module.exports = CommandSuggestionsService;
