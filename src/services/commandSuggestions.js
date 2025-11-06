const GeminiService = require('../../services/gemini');
const logger = require('../utils/logger');

class CommandSuggestionsService {
  constructor() {
    this.gemini = new GeminiService();
    this.commandCategories = {
      ai: ['gemini', 'deepseek', 'felo', 'hika', 'venice'],
      image: ['dalle', 'flux', 'animagine', 'deepdreams', 'text2image'],
      video: ['videogpt'],
      misc: [
        'editimage',
        'geminicanvas',
        'geminiedit',
        'image2prompt',
        'removewm',
        'upscale',
        'youtubesummarizer',
      ],
      converter: ['sticker', 'stickerwm', 'toaudio', 'togif', 'toimage', 'tovid', 'tovn'],
      downloader: [
        'youtubevideo',
        'youtubeaudio',
        'instagramdl',
        'facebookdl',
        'tiktokdl',
        'twitterdl',
        'spotifydl',
        'soundclouddl',
      ],
      entertainment: ['meme', 'joke', 'quotes', 'cecan', 'waifu', 'animeinfo', 'mangainfo'],
      game: ['tebakgambar', 'tebaklagu', 'family100', 'suit', 'kuis'],
      group: ['add', 'kick', 'promote', 'demote', 'tagall', 'hidetag'],
      information: ['ping', 'about', 'server', 'uptime', 'speedtest'],
      profile: ['profile', 'coin', 'leaderboard', 'claim'],
      search: ['googlesearch', 'youtubesearch', 'githubsearch', 'npmsearch'],
      tool: ['weather', 'translate', 'ocr', 'fetch', 'screenshot'],
    };

    this.commandDescriptions = {
      // AI commands
      gemini: 'Chat with Google Gemini AI assistant',
      dalle: 'Generate images using DALL-E',

      // Media commands
      sticker: 'Convert images to WhatsApp stickers',
      youtubevideo: 'Download videos from YouTube',
      instagramdl: 'Download content from Instagram',

      // Entertainment
      meme: 'Get random memes',
      joke: 'Get random jokes',
      weather: 'Get weather information',

      // Utilities
      translate: 'Translate text between languages',
      ping: 'Check bot response time',
      profile: 'View your profile information',
    };
  }

  /**
   * Analyze user input and suggest relevant commands
   * @param {string} userInput - The user's message
   * @param {Array} recentCommands - Recently used commands by the user
   * @returns {Promise<Array>} Array of suggested commands with confidence scores
   */
  async suggestCommands(userInput, recentCommands = []) {
    if (!userInput || userInput.trim().length < 2) {
      return [];
    }

    try {
      logger.debug('Analyzing user input for command suggestions', {
        inputLength: userInput.length,
        recentCommandsCount: recentCommands.length,
      });

      // Create context for AI analysis
      const context = this.buildAnalysisContext(userInput, recentCommands);

      // Get suggestions from Gemini
      const suggestions = await this.analyzeWithGemini(context);

      // Filter and rank suggestions
      const rankedSuggestions = await this.rankSuggestions(suggestions, userInput, recentCommands);

      logger.debug('Generated command suggestions', {
        input: userInput.substring(0, 50),
        suggestionsCount: rankedSuggestions.length,
      });

      return rankedSuggestions.slice(0, 5); // Return top 5 suggestions
    } catch (error) {
      logger.error('Error generating command suggestions', {
        error: error.message,
        userInput: userInput.substring(0, 100),
      });

      // Fallback to basic keyword matching
      return this.fallbackSuggestions(userInput);
    }
  }

  /**
   * Build context for AI analysis
   * @param {string} userInput - User's message
   * @param {Array} recentCommands - Recent command usage
   * @returns {string} Analysis context
   */
  buildAnalysisContext(userInput, recentCommands) {
    const recentCmds = recentCommands.slice(-3).join(', ');
    const availableCategories = Object.keys(this.commandCategories).join(', ');

    return `Analyze this user message and suggest the most relevant WhatsApp bot commands.

User Message: "${userInput}"

Recent Commands Used: ${recentCmds || 'none'}

Available Command Categories: ${availableCategories}

For each category, consider:
- AI/Chat: For questions, conversations, analysis
- Image: For image generation, editing, conversion
- Video: For video processing and generation
- Converter: For file format conversions
- Downloader: For downloading content from platforms
- Entertainment: For fun content, memes, jokes
- Game: For games and quizzes
- Group: For group management
- Information: For bot info and system status
- Profile: For user profile and statistics
- Search: For web and platform searches
- Tool: For utilities like weather, translation

Return a JSON array of suggested commands with confidence scores (0-1):
[{"command": "command_name", "category": "category_name", "confidence": 0.85, "reason": "brief reason"}]`;
  }

  /**
   * Analyze user input with Gemini AI
   * @param {string} context - Analysis context
   * @returns {Promise<Array>} AI-generated suggestions
   */
  async analyzeWithGemini(context) {
    try {
      const prompt = `${context}

Respond with ONLY a valid JSON array. No additional text or formatting.`;

      const response = await this.gemini.getChatCompletion(prompt);

      // Clean the response to ensure it's valid JSON
      const cleanedResponse = response
        .trim()
        .replace(/^```json\s*/, '')
        .replace(/\s*```$/, '');

      const suggestions = JSON.parse(cleanedResponse);

      if (!Array.isArray(suggestions)) {
        throw new Error('Invalid response format from Gemini');
      }

      return suggestions;
    } catch (error) {
      logger.warn('Failed to parse Gemini suggestions response', {
        error: error.message,
        response: error.response?.data || 'No response data',
      });

      // Return empty array on parsing error
      return [];
    }
  }

  /**
   * Rank and filter suggestions based on various factors
   * @param {Array} suggestions - Raw AI suggestions
   * @param {string} userInput - Original user input
   * @param {Array} recentCommands - Recent command usage
   * @returns {Promise<Array>} Ranked suggestions
   */
  async rankSuggestions(suggestions, userInput, recentCommands) {
    const ranked = [];

    for (const suggestion of suggestions) {
      if (!suggestion.command || !suggestion.category) continue;

      let score = suggestion.confidence || 0.5;

      // Boost score for recently used commands
      if (recentCommands.includes(suggestion.command)) {
        score += 0.2;
      }

      // Boost score for keyword matches in user input
      const keywords = this.extractKeywords(userInput);
      const commandDesc = this.commandDescriptions[suggestion.command] || '';
      const keywordMatches = keywords.filter(
        keyword =>
          commandDesc.toLowerCase().includes(keyword.toLowerCase()) ||
          suggestion.command.toLowerCase().includes(keyword.toLowerCase())
      ).length;

      score += keywordMatches * 0.1;

      // Boost score for category relevance
      const categoryCommands = this.commandCategories[suggestion.category] || [];
      if (categoryCommands.includes(suggestion.command)) {
        score += 0.1;
      }

      // Ensure score doesn't exceed 1.0
      score = Math.min(score, 1.0);

      ranked.push({
        command: suggestion.command,
        category: suggestion.category,
        confidence: score,
        reason: suggestion.reason || 'AI suggested',
        description:
          this.commandDescriptions[suggestion.command] || `${suggestion.command} command`,
      });
    }

    // Sort by confidence score (highest first)
    return ranked.sort((a, b) => b.confidence - a.confidence);
  }

  /**
   * Extract keywords from user input
   * @param {string} input - User input text
   * @returns {Array} Array of keywords
   */
  extractKeywords(input) {
    const keywords = [];

    // Common action words
    const actions = [
      'download',
      'convert',
      'generate',
      'create',
      'get',
      'find',
      'search',
      'play',
      'show',
      'tell',
    ];
    const media = ['video', 'image', 'photo', 'music', 'song', 'sticker', 'gif', 'audio'];
    const platforms = ['youtube', 'instagram', 'facebook', 'tiktok', 'twitter', 'spotify'];

    const words = input.toLowerCase().split(/\s+/);

    keywords.push(
      ...words.filter(
        word =>
          actions.includes(word) ||
          media.includes(word) ||
          platforms.includes(word) ||
          word.length > 3 // Longer words are likely more specific
      )
    );

    return [...new Set(keywords)]; // Remove duplicates
  }

  /**
   * Fallback suggestions using basic keyword matching
   * @param {string} userInput - User input
   * @returns {Array} Basic suggestions
   */
  fallbackSuggestions(userInput) {
    const input = userInput.toLowerCase();
    const suggestions = [];

    // Basic keyword matching
    if (input.includes('weather') || input.includes('temperature')) {
      suggestions.push({
        command: 'weather',
        category: 'tool',
        confidence: 0.8,
        reason: 'Weather-related keywords detected',
        description: 'Get weather information',
      });
    }

    if (input.includes('translate') || input.includes('translation')) {
      suggestions.push({
        command: 'translate',
        category: 'tool',
        confidence: 0.8,
        reason: 'Translation keywords detected',
        description: 'Translate text between languages',
      });
    }

    if (input.includes('image') || input.includes('picture') || input.includes('photo')) {
      suggestions.push({
        command: 'dalle',
        category: 'image',
        confidence: 0.7,
        reason: 'Image-related keywords detected',
        description: 'Generate images using DALL-E',
      });
    }

    if (input.includes('video') || input.includes('youtube')) {
      suggestions.push({
        command: 'youtubevideo',
        category: 'downloader',
        confidence: 0.7,
        reason: 'Video/YouTube keywords detected',
        description: 'Download videos from YouTube',
      });
    }

    if (input.includes('sticker') || input.includes('emoji')) {
      suggestions.push({
        command: 'sticker',
        category: 'converter',
        confidence: 0.7,
        reason: 'Sticker-related keywords detected',
        description: 'Convert images to WhatsApp stickers',
      });
    }

    if (input.includes('joke') || input.includes('funny')) {
      suggestions.push({
        command: 'joke',
        category: 'entertainment',
        confidence: 0.6,
        reason: 'Humor-related keywords detected',
        description: 'Get random jokes',
      });
    }

    return suggestions;
  }

  /**
   * Get command usage statistics for personalization
   * @param {string} userId - User ID
   * @returns {Promise<Array>} Recent command usage
   */
  async getUserCommandHistory(userId) {
    try {
      // This would integrate with your database service
      // For now, return a mock implementation
      const mockHistory = ['ping', 'weather', 'gemini'];
      logger.debug('Retrieved user command history', { userId, historyCount: mockHistory.length });
      return mockHistory;
    } catch (error) {
      logger.error('Error retrieving user command history', { userId, error: error.message });
      return [];
    }
  }

  /**
   * Learn from user interactions to improve suggestions
   * @param {string} userId - User ID
   * @param {string} selectedCommand - Command the user actually used
   * @param {string} originalInput - Original user input
   */
  async learnFromInteraction(userId, selectedCommand, originalInput) {
    try {
      logger.debug('Learning from user interaction', {
        userId,
        selectedCommand,
        inputLength: originalInput.length,
      });

      // This would store learning data for future improvements
      // Could be used to fine-tune the AI suggestions over time
    } catch (error) {
      logger.error('Error learning from user interaction', {
        userId,
        selectedCommand,
        error: error.message,
      });
    }
  }

  /**
   * Get popular commands for general suggestions
   * @returns {Array} Popular command suggestions
   */
  getPopularCommands() {
    return [
      {
        command: 'gemini',
        category: 'ai-chat',
        confidence: 0.9,
        reason: 'Most popular AI chat command',
        description: 'Chat with Google Gemini AI assistant',
      },
      {
        command: 'ping',
        category: 'information',
        confidence: 0.8,
        reason: 'Frequently used status check',
        description: 'Check bot response time',
      },
      {
        command: 'weather',
        category: 'tool',
        confidence: 0.7,
        reason: 'Popular utility command',
        description: 'Get weather information',
      },
      {
        command: 'sticker',
        category: 'converter',
        confidence: 0.6,
        reason: 'Popular media conversion',
        description: 'Convert images to WhatsApp stickers',
      },
    ];
  }

  /**
   * Health check for the suggestions service
   * @returns {Promise<Object>} Health status
   */
  async healthCheck() {
    try {
      const testInput = 'hello world';
      const suggestions = await this.suggestCommands(testInput);

      return {
        status: 'healthy',
        service: 'command-suggestions',
        testInput,
        suggestionsCount: suggestions.length,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      logger.error('Command suggestions health check failed', { error: error.message });
      return {
        status: 'unhealthy',
        service: 'command-suggestions',
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }
}

module.exports = CommandSuggestionsService;
