const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const GeminiService = require('../../services/gemini');
const logger = require('../utils/logger');

class NLPProcessorService {
  constructor() {
    this.gemini = new GeminiService();
    this.intentCache = new Map();
    this.cacheExpiry = 30 * 60 * 1000; // 30 minutes
    this.commandPatterns = {};
    this.intentMap = {};
    this.initialize();
  }

  async initialize() {
    await this.loadNlpConfig();
    logger.info('NLP Processor service initialized with dynamic configuration from database');
  }

  async loadNlpConfig() {
    const configs = await prisma.nlpConfig.findMany();
    for (const config of configs) {
      if (config.type === 'command_pattern') {
        this.commandPatterns[config.key] = config.value;
      } else if (config.type === 'intent_map') {
        this.intentMap[config.key] = config.value;
      }
    }
  }

  async processInput(input, context = {}) {
    if (!input || input.trim().length < 2) {
      return { intent: null, confidence: 0, command: null };
    }

    const cacheKey = this._generateCacheKey(input, context);
    const cachedResult = this._getCachedResult(cacheKey);
    if (cachedResult) {
      return cachedResult;
    }

    const result = await this._multiStepProcessing(input, context);
    this._setCachedResult(cacheKey, result);
    return result;
  }

  async _multiStepProcessing(input, context) {
    const processedInput = this._preprocessInput(input);
    const keywords = this._extractKeywords(processedInput);
    const intentResult = await this._classifyIntent(processedInput, keywords, context);
    const commandResult = this._mapToCommand(intentResult, keywords, context);
    const confidence = this._calculateConfidence(intentResult, keywords, commandResult);

    return {
      intent: intentResult.intent,
      confidence,
      command: commandResult.command,
      parameters: commandResult.parameters || {},
    };
  }

  _preprocessInput(input) {
    return input.toLowerCase().trim().replace(/[^\w\s]/g, ' ').replace(/\s+/g, ' ');
  }

  _extractKeywords(input) {
    // A real implementation would use a stop word list from the database
    const stopWords = ['the', 'a', 'an', 'is', 'in'];
    return input.split(' ').filter(word => word.length > 2 && !stopWords.includes(word));
  }

  async _classifyIntent(input, keywords, context) {
    // Simplified intent classification. A real implementation would use a more robust model.
    for (const [pattern, data] of Object.entries(this.commandPatterns)) {
        if (keywords.some(kw => data.keywords.includes(kw))) {
            return { intent: pattern, confidence: 0.8, explanation: 'Keyword match' };
        }
    }
    return { intent: 'unknown', confidence: 0.3, explanation: 'No keyword match' };
  }

  _mapToCommand(intentResult, keywords, context) {
    const intent = intentResult.intent;
    if (this.intentMap[intent]) {
        return { command: this.intentMap[intent] };
    }

    const pattern = this.commandPatterns[intent];
    if (pattern && pattern.commands.length > 0) {
        return { command: pattern.commands[0] }; // Default to the first command
    }

    return { command: 'gemini' }; // Fallback command
  }

  _calculateConfidence(intentResult, keywords, commandResult) {
    // Simplified confidence logic
    let confidence = intentResult.confidence || 0.5;
    if (keywords.some(kw => commandResult.command.includes(kw))) {
        confidence = Math.min(1, confidence + 0.2);
    }
    return confidence;
  }

  _generateCacheKey(input, context) {
    const crypto = require('crypto');
    const hash = crypto.createHash('md5');
    hash.update(`${input}:${context.userId || ''}`);
    return `nlp:${hash.digest('hex')}`;
  }

  _getCachedResult(key) {
    const cached = this.intentCache.get(key);
    if (cached && (Date.now() - cached.timestamp) < this.cacheExpiry) {
        return cached.result;
    }
    this.intentCache.delete(key);
    return null;
  }

  _setCachedResult(key, result) {
    this.intentCache.set(key, { result, timestamp: Date.now() });
  }
}

module.exports = NLPProcessorService;
