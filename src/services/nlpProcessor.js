const GeminiService = require('../../services/gemini');
const logger = require('../utils/logger');

class NLPProcessorService {
  constructor() {
    this.gemini = new GeminiService();
    this.intentCache = new Map();
    this.cacheExpiry = 30 * 60 * 1000; // 30 minutes

    // Command patterns and keywords
    this.commandPatterns = {
      // AI/Chat commands
      chat: {
        keywords: ['talk', 'chat', 'ask', 'tell', 'explain', 'help', 'question', 'answer'],
        commands: ['gemini', 'chatgpt', 'deepseek', 'felo', 'hika', 'venice']
      },

      // Image commands
      image: {
        keywords: ['image', 'picture', 'photo', 'generate', 'create', 'draw', 'design', 'art'],
        commands: ['dalle', 'flux', 'animagine', 'deepdreams', 'text2image']
      },

      // Video commands
      video: {
        keywords: ['video', 'movie', 'film', 'clip', 'download', 'stream'],
        commands: ['videogpt', 'youtubevideo']
      },

      // Download commands
      download: {
        keywords: ['download', 'get', 'save', 'fetch', 'retrieve'],
        commands: ['youtubevideo', 'youtubeaudio', 'instagramdl', 'facebookdl', 'tiktokdl', 'twitterdl', 'spotifydl', 'soundclouddl']
      },

      // Entertainment commands
      entertainment: {
        keywords: ['fun', 'joke', 'meme', 'quote', 'game', 'play', 'entertain'],
        commands: ['joke', 'meme', 'quotes', 'cecan', 'waifu', 'animeinfo', 'mangainfo']
      },

      // Utility commands
      utility: {
        keywords: ['weather', 'translate', 'convert', 'sticker', 'ocr', 'search'],
        commands: ['weather', 'translate', 'sticker', 'ocr', 'googlesearch', 'youtubesearch']
      },

      // Information commands
      info: {
        keywords: ['info', 'information', 'about', 'status', 'ping', 'uptime', 'server'],
        commands: ['ping', 'about', 'server', 'uptime', 'speedtest']
      },

      // Profile commands
      profile: {
        keywords: ['profile', 'level', 'xp', 'coin', 'balance', 'stats', 'leaderboard'],
        commands: ['profile', 'coin', 'leaderboard', 'claim']
      }
    };

    // Intent mapping
    this.intentMap = {
      'create_image': 'dalle',
      'generate_image': 'dalle',
      'make_sticker': 'sticker',
      'download_video': 'youtubevideo',
      'download_music': 'youtubeaudio',
      'get_weather': 'weather',
      'translate_text': 'translate',
      'tell_joke': 'joke',
      'show_meme': 'meme',
      'check_profile': 'profile',
      'search_google': 'googlesearch',
      'search_youtube': 'youtubesearch',
      'play_game': 'family100',
      'get_quote': 'quotes'
    };

    logger.info('NLP Processor service initialized');
  }

  /**
   * Process natural language input and extract command intent
   * @param {string} input - User's natural language input
   * @param {Object} context - User context (history, preferences, etc.)
   * @returns {Promise<Object>} Processing result with intent and confidence
   */
  async processInput(input, context = {}) {
    if (!input || input.trim().length < 2) {
      return { intent: null, confidence: 0, command: null };
    }

    try {
      logger.debug('Processing natural language input', {
        inputLength: input.length,
        userId: context.userId
      });

      // Check cache first
      const cacheKey = this.generateCacheKey(input, context);
      const cachedResult = this.getCachedResult(cacheKey);
      if (cachedResult) {
        logger.debug('Returning cached NLP result', { cacheKey });
        return cachedResult;
      }

      // Multi-step processing
      const result = await this.multiStepProcessing(input, context);

      // Cache the result
      this.setCachedResult(cacheKey, result);

      logger.debug('NLP processing completed', {
        intent: result.intent,
        confidence: result.confidence,
        command: result.command
      });

      return result;
    } catch (error) {
      logger.error('NLP processing failed', {
        error: error.message,
        input: input.substring(0, 100)
      });

      // Fallback to pattern matching
      return this.patternMatchingFallback(input);
    }
  }

  /**
   * Multi-step natural language processing
   * @param {string} input - User input
   * @param {Object} context - Context information
   * @returns {Promise<Object>} Processing result
   */
  async multiStepProcessing(input, context) {
    // Step 1: Preprocessing
    const processedInput = this.preprocessInput(input);

    // Step 2: Keyword extraction
    const keywords = this.extractKeywords(processedInput);

    // Step 3: Intent classification
    const intentResult = await this.classifyIntent(processedInput, keywords, context);

    // Step 4: Command mapping
    const commandResult = this.mapToCommand(intentResult, keywords, context);

    // Step 5: Confidence calculation
    const confidence = this.calculateConfidence(intentResult, keywords, commandResult);

    return {
      intent: intentResult.intent,
      confidence: confidence,
      command: commandResult.command,
      parameters: commandResult.parameters,
      alternatives: commandResult.alternatives,
      explanation: intentResult.explanation
    };
  }

  /**
   * Preprocess input text
   * @param {string} input - Raw input
   * @returns {string} Processed input
   */
  preprocessInput(input) {
    return input
      .toLowerCase()
      .trim()
      .replace(/[^\w\s]/g, ' ') // Remove punctuation
      .replace(/\s+/g, ' ') // Normalize whitespace
      .substring(0, 500); // Limit length
  }

  /**
   * Extract keywords from input
   * @param {string} input - Processed input
   * @returns {Array} Array of keywords
   */
  extractKeywords(input) {
    const words = input.split(' ');
    const keywords = [];

    // Extract meaningful words (longer than 2 chars, not common words)
    const stopWords = ['the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'an', 'a'];

    for (const word of words) {
      if (word.length > 2 && !stopWords.includes(word)) {
        keywords.push(word);
      }
    }

    return keywords;
  }

  /**
   * Classify user intent using AI
   * @param {string} input - Processed input
   * @param {Array} keywords - Extracted keywords
   * @param {Object} context - Context information
   * @returns {Promise<Object>} Intent classification result
   */
  async classifyIntent(input, keywords, context) {
    try {
      const prompt = `Analyze this user message and determine their intent. Respond with a JSON object containing:
- intent: the primary intent (e.g., "create_image", "download_video", "get_weather", "tell_joke")
- confidence: confidence score (0-1)
- explanation: brief explanation of the intent

Message: "${input}"
Keywords: ${keywords.join(', ')}

Available intents:
- create_image: generate or create images
- download_video: download videos from platforms
- download_music: download audio/music
- get_weather: check weather information
- translate_text: translate between languages
- tell_joke: get jokes or humor
- show_meme: display memes
- search_web: search the internet
- play_game: play games or quizzes
- get_info: get information or status
- convert_media: convert files (sticker, audio, etc.)

Respond with ONLY valid JSON, no additional text.`;

      const response = await this.gemini.getChatCompletion(prompt);
      const result = JSON.parse(response);

      return {
        intent: result.intent || 'unknown',
        confidence: result.confidence || 0.5,
        explanation: result.explanation || 'AI-classified intent'
      };
    } catch (error) {
      logger.warn('AI intent classification failed, using fallback', { error: error.message });
      return this.fallbackIntentClassification(input, keywords);
    }
  }

  /**
   * Map intent to specific bot command
   * @param {Object} intentResult - Intent classification result
   * @param {Array} keywords - Keywords from input
   * @param {Object} context - Context information
   * @returns {Object} Command mapping result
   */
  mapToCommand(intentResult, keywords, context) {
    const intent = intentResult.intent;

    // Direct intent mapping
    if (this.intentMap[intent]) {
      return {
        command: this.intentMap[intent],
        parameters: this.extractParameters(intent, keywords),
        alternatives: this.getAlternativeCommands(intent)
      };
    }

    // Pattern-based mapping
    for (const [category, data] of Object.entries(this.commandPatterns)) {
      const keywordMatch = keywords.some(keyword =>
        data.keywords.some(catKeyword => catKeyword.includes(keyword) || keyword.includes(catKeyword))
      );

      if (keywordMatch) {
        const bestCommand = this.selectBestCommand(data.commands, keywords, context);
        return {
          command: bestCommand,
          parameters: this.extractParameters(intent, keywords),
          alternatives: data.commands.filter(cmd => cmd !== bestCommand)
        };
      }
    }

    // Fallback to most common command
    return {
      command: 'gemini',
      parameters: {},
      alternatives: ['chatgpt', 'ping', 'help']
    };
  }

  /**
   * Select the best command from alternatives
   * @param {Array} commands - Available commands
   * @param {Array} keywords - User keywords
   * @param {Object} context - User context
   * @returns {string} Best command match
   */
  selectBestCommand(commands, keywords, context) {
    // Score each command based on keyword relevance
    const scores = commands.map(command => {
      let score = 0;

      // Check if command name matches keywords
      if (keywords.some(keyword => command.includes(keyword))) {
        score += 0.5;
      }

      // Check user history preference
      if (context.recentCommands && context.recentCommands.includes(command)) {
        score += 0.3;
      }

      // Check command popularity (could be from analytics)
      if (['gemini', 'ping', 'weather'].includes(command)) {
        score += 0.2;
      }

      return { command, score };
    });

    // Return highest scoring command
    scores.sort((a, b) => b.score - a.score);
    return scores[0].command;
  }

  /**
   * Extract parameters from user input
   * @param {string} intent - Classified intent
   * @param {Array} keywords - Keywords from input
   * @returns {Object} Extracted parameters
   */
  extractParameters(intent, keywords) {
    const params = {};

    // Extract location for weather
    if (intent === 'get_weather') {
      const locationKeywords = keywords.filter(keyword =>
        !['weather', 'get', 'check', 'show', 'tell'].includes(keyword)
      );
      if (locationKeywords.length > 0) {
        params.location = locationKeywords.join(' ');
      }
    }

    // Extract search query
    if (['search_web', 'download_video', 'download_music'].includes(intent)) {
      params.query = keywords.filter(keyword =>
        !['download', 'search', 'find', 'get', 'video', 'music', 'song'].includes(keyword)
      ).join(' ');
    }

    // Extract translation parameters
    if (intent === 'translate_text') {
      // This would need more sophisticated parsing
      params.text = keywords.join(' ');
    }

    return params;
  }

  /**
   * Get alternative commands for an intent
   * @param {string} intent - The intent
   * @returns {Array} Alternative commands
   */
  getAlternativeCommands(intent) {
    const alternatives = {
      'create_image': ['flux', 'animagine', 'deepdreams'],
      'download_video': ['instagramdl', 'facebookdl', 'tiktokdl'],
      'get_weather': ['ping'], // Limited alternatives
      'tell_joke': ['meme', 'quotes'],
      'search_web': ['youtubesearch', 'githubsearch']
    };

    return alternatives[intent] || [];
  }

  /**
   * Calculate overall confidence score
   * @param {Object} intentResult - Intent classification
   * @param {Array} keywords - Keywords
   * @param {Object} commandResult - Command mapping
   * @returns {number} Confidence score (0-1)
   */
  calculateConfidence(intentResult, keywords, commandResult) {
    let confidence = intentResult.confidence || 0.5;

    // Boost confidence for direct keyword matches
    if (keywords.some(keyword => commandResult.command.includes(keyword))) {
      confidence += 0.2;
    }

    // Boost confidence for clear intents
    const clearIntents = ['create_image', 'get_weather', 'tell_joke'];
    if (clearIntents.includes(intentResult.intent)) {
      confidence += 0.1;
    }

    // Reduce confidence for ambiguous inputs
    if (keywords.length < 2) {
      confidence -= 0.2;
    }

    return Math.max(0, Math.min(1, confidence));
  }

  /**
   * Fallback intent classification using patterns
   * @param {string} input - User input
   * @param {Array} keywords - Keywords
   * @returns {Object} Fallback classification
   */
  fallbackIntentClassification(input, keywords) {
    // Simple pattern matching
    if (input.includes('weather') || input.includes('temperature')) {
      return { intent: 'get_weather', confidence: 0.8, explanation: 'Weather keywords detected' };
    }

    if (input.includes('image') || input.includes('picture') || input.includes('generate')) {
      return { intent: 'create_image', confidence: 0.8, explanation: 'Image-related keywords detected' };
    }

    if (input.includes('download') || input.includes('video')) {
      return { intent: 'download_video', confidence: 0.7, explanation: 'Download keywords detected' };
    }

    if (input.includes('joke') || input.includes('funny')) {
      return { intent: 'tell_joke', confidence: 0.8, explanation: 'Humor keywords detected' };
    }

    return { intent: 'unknown', confidence: 0.3, explanation: 'Unable to classify intent' };
  }

  /**
   * Pattern matching fallback
   * @param {string} input - User input
   * @returns {Object} Fallback result
   */
  patternMatchingFallback(input) {
    const lowerInput = input.toLowerCase();

    // Direct pattern matches
    for (const [category, data] of Object.entries(this.commandPatterns)) {
      for (const keyword of data.keywords) {
        if (lowerInput.includes(keyword)) {
          return {
            intent: category,
            confidence: 0.6,
            command: data.commands[0], // Use first command as default
            parameters: {},
            alternatives: data.commands.slice(1)
          };
        }
      }
    }

    // Default fallback
    return {
      intent: 'unknown',
      confidence: 0.2,
      command: 'gemini',
      parameters: {},
      alternatives: ['ping', 'help']
    };
  }

  /**
   * Generate cache key for NLP results
   * @param {string} input - User input
   * @param {Object} context - Context information
   * @returns {string} Cache key
   */
  generateCacheKey(input, context) {
    const hash = require('crypto').createHash('md5');
    hash.update(`${input}:${context.userId || 'anonymous'}:${context.recentCommands?.join(',') || ''}`);
    return `nlp:${hash.digest('hex')}`;
  }

  /**
   * Get cached result
   * @param {string} key - Cache key
   * @returns {Object|null} Cached result or null
   */
  getCachedResult(key) {
    const cached = this.intentCache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheExpiry) {
      return cached.result;
    }
    if (cached) {
      this.intentCache.delete(key); // Remove expired entry
    }
    return null;
  }

  /**
   * Set cached result
   * @param {string} key - Cache key
   * @param {Object} result - Result to cache
   */
  setCachedResult(key, result) {
    this.intentCache.set(key, {
      result,
      timestamp: Date.now()
    });
  }

  /**
   * Clear expired cache entries
   */
  clearExpiredCache() {
    const now = Date.now();
    for (const [key, value] of this.intentCache.entries()) {
      if (now - value.timestamp > this.cacheExpiry) {
        this.intentCache.delete(key);
      }
    }
    logger.debug(`Cleared expired NLP cache entries. Remaining: ${this.intentCache.size}`);
  }

  /**
   * Health check for NLP service
   * @returns {Promise<Object>} Health status
   */
  async healthCheck() {
    try {
      const testInput = 'hello world';
      const result = await this.processInput(testInput);

      return {
        status: 'healthy',
        service: 'nlp-processor',
        cacheSize: this.intentCache.size,
        testInput,
        testResult: result.intent,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      logger.error('NLP processor health check failed', { error: error.message });
      return {
        status: 'unhealthy',
        service: 'nlp-processor',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }
}

module.exports = NLPProcessorService;