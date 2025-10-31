const { GoogleGenerativeAI } = require('@google/generative-ai');
const logger = require('../src/utils/logger');
const crypto = require('crypto');

class GeminiService {
  constructor() {
    this.apiKey = process.env.GOOGLE_GEMINI_API_KEY;
    if (!this.apiKey) {
      throw new Error('GOOGLE_GEMINI_API_KEY environment variable is required');
    }

    this.genAI = new GoogleGenerativeAI(this.apiKey);
    this.model = this.genAI.getGenerativeModel({
      model: 'gemini-2.0-flash-exp',
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 2048,
      },
    });

    // Initialize cache service
    this.cache = null;
    try {
      const CacheService = require('../src/services/cache');
      this.cache = new CacheService();
    } catch (error) {
      logger.warn('Cache service not available, proceeding without caching', { error: error.message });
    }

    logger.info('Gemini service initialized with official Google Generative AI SDK');
  }

  /**
   * Generate cache key for AI responses
   * @param {string} prompt - The input prompt
   * @param {string} type - Type of request (chat, summary, etc.)
   * @returns {string} Cache key
   */
  generateCacheKey(prompt, type = 'chat') {
    const hash = crypto.createHash('md5').update(prompt).digest('hex');
    return `gemini:${type}:${hash}`;
  }

  /**
   * Get a chat completion from Google Gemini API with caching
   * @param {string} text - The user's input text
   * @returns {Promise<string>} The response text from Gemini
   */
  async getChatCompletion(text, correlationId = null) {
    const logger = require('../src/utils/logger');
    if (!text) {
      throw new Error('Input text is required.');
    }

    const cacheKey = this.generateCacheKey(text, 'chat');

    // Try to get from cache first
    if (this.cache) {
      const cachedResponse = await this.cache.get(cacheKey);
      if (cachedResponse) {
        logger.debug('Returning cached Gemini response', { cacheKey, correlationId });
        return cachedResponse;
      }
    }

    const maxRetries = 3;
    const baseDelay = 1000;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        logger.info('Gemini chat completion request', {
          correlationId,
          attempt,
          textLength: text.length
        });

        const result = await this.model.generateContent(text);
        const response = await result.response;
        const message = response.text();

        if (!message) {
          throw new Error('Empty response from Gemini API');
        }

        // Cache the response
        if (this.cache) {
          await this.cache.set(cacheKey, message, 1800); // Cache for 30 minutes
          logger.debug('Cached Gemini response', { cacheKey, correlationId });
        }

        logger.info('Gemini chat completion success', {
          correlationId,
          attempt,
          responseLength: message.length
        });
        return message;
      } catch (error) {
        logger.warn('Gemini chat completion attempt failed', {
          correlationId,
          attempt,
          maxRetries,
          error: error.message,
          retryAfter: attempt < maxRetries ? baseDelay * Math.pow(2, attempt - 1) : null
        });

        if (attempt === maxRetries) {
          logger.error('Gemini chat completion failed after retries', {
            correlationId,
            error: error.message,
            text: text.substring(0, 100) + '...'
          });
          throw new Error(`Failed to get response from Gemini API: ${error.message}`);
        }

        // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, baseDelay * Math.pow(2, attempt - 1)));
      }
    }
  }

  /**
   * Get a chat completion with conversation history and caching
   * @param {Array} messages - Array of message objects with role and content
   * @returns {Promise<string>} The response text from Gemini
   */
  async getChatCompletionWithHistory(messages, correlationId = null) {
    const logger = require('../src/utils/logger');
    if (!messages || messages.length === 0) {
      throw new Error('Messages array is required.');
    }

    // Create a cache key based on the conversation
    const conversationKey = messages.map(m => `${m.role}:${m.content}`).join('|');
    const cacheKey = this.generateCacheKey(conversationKey, 'conversation');

    // Try to get from cache first
    if (this.cache) {
      const cachedResponse = await this.cache.get(cacheKey);
      if (cachedResponse) {
        logger.debug('Returning cached Gemini conversation response', { cacheKey, correlationId });
        return cachedResponse;
      }
    }

    const maxRetries = 3;
    const baseDelay = 1000;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        logger.info('Gemini chat completion with history request', {
          correlationId,
          attempt,
          messageCount: messages.length
        });

        // Convert messages to Gemini format
        const history = messages.slice(0, -1).map(msg => ({
          role: msg.role === 'user' ? 'user' : 'model',
          parts: [{ text: msg.content }]
        }));

        const chat = this.model.startChat({
          history: history,
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 2048,
          }
        });

        const lastMessage = messages[messages.length - 1];
        const result = await chat.sendMessage(lastMessage.content);
        const response = await result.response;
        const message = response.text();

        // Cache the response
        if (this.cache) {
          await this.cache.set(cacheKey, message, 1800); // Cache for 30 minutes
          logger.debug('Cached Gemini conversation response', { cacheKey, correlationId });
        }

        logger.info('Gemini chat completion with history success', {
          correlationId,
          attempt,
          responseLength: message.length
        });
        return message;
      } catch (error) {
        logger.warn('Gemini chat completion with history attempt failed', {
          correlationId,
          attempt,
          maxRetries,
          error: error.message,
          messageCount: messages.length,
          retryAfter: attempt < maxRetries ? baseDelay * Math.pow(2, attempt - 1) : null
        });

        if (attempt === maxRetries) {
          logger.error('Gemini chat completion with history failed after retries', {
            correlationId,
            error: error.message,
            messageCount: messages.length
          });
          throw new Error(`Failed to get response from Gemini API: ${error.message}`);
        }

        await new Promise(resolve => setTimeout(resolve, baseDelay * Math.pow(2, attempt - 1)));
      }
    }
  }

  /**
   * Get a chat completion with function calling support and caching
   * @param {Array} messages - Array of message objects
   * @param {Array} tools - Array of tool definitions
   * @returns {Promise<Object>} The full response object with potential tool calls
   */
  async getChatCompletionWithTools(messages, tools) {
    if (!messages || messages.length === 0) {
      throw new Error('Messages are required.');
    }

    // Create cache key for tool-based conversations
    const toolKey = tools ? tools.map(t => t.function?.name).sort().join(',') : 'no-tools';
    const conversationKey = `${messages.map(m => `${m.role}:${m.content}`).join('|')}|tools:${toolKey}`;
    const cacheKey = this.generateCacheKey(conversationKey, 'tools');

    // Try to get from cache first
    if (this.cache) {
      const cachedResponse = await this.cache.get(cacheKey);
      if (cachedResponse) {
        logger.debug('Returning cached Gemini tools response', { cacheKey });
        return cachedResponse;
      }
    }

    try {
      logger.debug('Sending chat completion with tools to Gemini', {
        messageCount: messages.length,
        toolCount: tools?.length || 0
      });

      // Convert tools to Gemini format
      const geminiTools = tools ? this.convertToolsToGeminiFormat(tools) : [];

      const modelWithTools = this.genAI.getGenerativeModel({
        model: 'gemini-2.0-flash-exp',
        tools: geminiTools.length > 0 ? [{ functionDeclarations: geminiTools }] : [],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 2048,
        },
      });

      // Convert messages to Gemini format
      const geminiMessages = messages.map(msg => ({
        role: msg.role === 'user' ? 'user' : msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }]
      }));

      const chat = modelWithTools.startChat({
        history: geminiMessages.slice(0, -1)
      });

      const lastMessage = geminiMessages[geminiMessages.length - 1];
      const result = await chat.sendMessage(lastMessage.parts[0].text);
      const response = await result.response;

      // Check for function calls
      const functionCalls = response.functionCalls();
      let responseData;

      if (functionCalls && functionCalls.length > 0) {
        responseData = {
          finish_reason: 'tool_calls',
          message: {
            role: 'assistant',
            content: response.text(),
            tool_calls: functionCalls.map(call => ({
              id: `call_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              function: {
                name: call.name,
                arguments: JSON.stringify(call.args)
              }
            }))
          }
        };
      } else {
        responseData = {
          finish_reason: 'stop',
          message: {
            role: 'assistant',
            content: response.text()
          }
        };
      }

      // Cache the response (shorter TTL for tool responses)
      if (this.cache) {
        await this.cache.set(cacheKey, responseData, 900); // Cache for 15 minutes
        logger.debug('Cached Gemini tools response', { cacheKey });
      }

      return responseData;
    } catch (error) {
      logger.error('Error fetching Gemini completion with tools', {
        error: error.message,
        messageCount: messages.length
      });
      throw new Error(`Failed to get response from Gemini API with tools: ${error.message}`);
    }
  }

  /**
   * Generate a summary of conversation messages with caching
   * @param {Array} messagesToSummarize - Array of message objects to summarize
   * @returns {Promise<string>} The summary text
   */
  async getSummary(messagesToSummarize) {
    if (!messagesToSummarize || messagesToSummarize.length === 0) {
      throw new Error('Messages to summarize are required.');
    }

    // Create cache key for summary
    const summaryKey = messagesToSummarize.map(m => `${m.role}:${m.content}`).join('|');
    const cacheKey = this.generateCacheKey(summaryKey, 'summary');

    // Try to get from cache first
    if (this.cache) {
      const cachedSummary = await this.cache.get(cacheKey);
      if (cachedSummary) {
        logger.debug('Returning cached Gemini summary', { cacheKey });
        return cachedSummary;
      }
    }

    try {
      logger.debug('Generating conversation summary with Gemini', {
        messageCount: messagesToSummarize.length
      });

      const summaryPrompt = `Please provide a concise summary of the following conversation, capturing the key points and main topics discussed:

${messagesToSummarize.map(msg => `${msg.role}: ${msg.content}`).join('\n\n')}

Summary:`;

      const result = await this.model.generateContent(summaryPrompt);
      const response = await result.response;
      const summary = response.text();

      // Cache the summary
      if (this.cache) {
        await this.cache.set(cacheKey, summary, 3600); // Cache for 1 hour
        logger.debug('Cached Gemini summary', { cacheKey });
      }

      logger.debug('Generated conversation summary', { summaryLength: summary.length });
      return summary;
    } catch (error) {
      logger.error('Error generating summary with Gemini', {
        error: error.message,
        messageCount: messagesToSummarize.length
      });
      throw new Error(`Failed to generate summary: ${error.message}`);
    }
  }

  /**
   * Moderate content using Gemini with caching
   * @param {string} content - Content to moderate
   * @returns {Promise<Object>} Moderation result
   */
  async moderateContent(content) {
    if (!content) {
      throw new Error('Content to moderate is required.');
    }

    const cacheKey = this.generateCacheKey(content, 'moderation');

    // Try to get from cache first
    if (this.cache) {
      const cachedResult = await this.cache.get(cacheKey);
      if (cachedResult) {
        logger.debug('Returning cached moderation result', { cacheKey });
        return cachedResult;
      }
    }

    try {
      logger.debug('Moderating content with Gemini', { contentLength: content.length });

      const moderationPrompt = `Please analyze the following content and determine if it contains:
1. Hate speech or discriminatory content
2. Violent or harmful content
3. Adult or explicit content
4. Spam or promotional content
5. Harassment or bullying

Content: "${content}"

Provide a JSON response with:
- safe: boolean (true if content is safe, false if not)
- categories: array of violated categories (if any)
- reason: brief explanation

Response format: {"safe": true/false, "categories": [], "reason": ""}`;

      const result = await this.model.generateContent(moderationPrompt);
      const response = await result.response;
      const moderationResult = response.text();

      // Parse JSON response
      let parsed;
      try {
        parsed = JSON.parse(moderationResult);
      } catch (parseError) {
        logger.warn('Failed to parse moderation response, assuming safe', { moderationResult });
        parsed = { safe: true, categories: [], reason: 'Unable to parse moderation result' };
      }

      // Cache the moderation result
      if (this.cache) {
        await this.cache.set(cacheKey, parsed, 1800); // Cache for 30 minutes
        logger.debug('Cached moderation result', { cacheKey });
      }

      logger.debug('Content moderation completed', parsed);
      return parsed;
    } catch (error) {
      logger.error('Error moderating content with Gemini - ALERT: Manual review required', {
        error: error.message,
        content: content.substring(0, 100) + '...'
      });

      // Broadcast alert to admin dashboard via WebSocket
      try {
        const AdminServer = require('../server');
        AdminServer.broadcast('moderation_alert', {
          content: content.substring(0, 200) + '...',
          reason: 'Moderation failure - manual review required',
          timestamp: new Date().toISOString(),
          severity: 'high'
        });
      } catch (broadcastError) {
        logger.warn('Failed to broadcast moderation alert', { error: broadcastError.message });
      }

      // Flag for audit (assume auditLogger available)
      try {
        const auditLogger = require('../src/services/auditLogger');
        await auditLogger.logEvent({
          eventType: 'MODERATION_FAILURE',
          actor: 'system',
          action: 'content_moderation_failed',
          resource: 'moderation',
          details: { contentPreview: content.substring(0, 100), error: error.message },
          riskLevel: 'high'
        });
      } catch (auditError) {
        logger.warn('Failed to log moderation failure to audit', { error: auditError.message });
      }

      throw new Error(`Moderation failed: ${error.message} - Content flagged for manual review`);
    }
  }

  /**
   * Convert tools from OpenAI format to Gemini format
   * @param {Array} tools - Tools in OpenAI format
   * @returns {Array} Tools in Gemini format
   */
  convertToolsToGeminiFormat(tools) {
    return tools.map(tool => ({
      name: tool.function.name,
      description: tool.function.description,
      parameters: tool.function.parameters
    }));
  }

  /**
   * Clear cache for specific patterns
   * @param {string} pattern - Cache key pattern to clear
   */
  async clearCache(pattern = 'gemini:*') {
    if (this.cache) {
      const cleared = await this.cache.invalidatePattern(pattern);
      logger.info(`Cleared ${cleared} cached Gemini responses`);
      return cleared;
    }
    return 0;
  }

  /**
   * Health check for Gemini service
   * @returns {Promise<Object>} Health status
   */
  async healthCheck() {
    try {
      const startTime = Date.now();
      const result = await this.model.generateContent('Hello');
      const response = await result.response;
      const text = response.text();
      const responseTime = Date.now() - startTime;

      return {
        status: 'healthy',
        model: 'gemini-2.0-flash-exp',
        responseTime,
        testResponse: text ? 'OK' : 'No response',
        cache: this.cache ? 'enabled' : 'disabled'
      };
    } catch (error) {
      logger.error('Gemini health check failed', { error: error.message });
      return {
        status: 'unhealthy',
        error: error.message,
        timestamp: Date.now(),
        cache: this.cache ? 'enabled' : 'disabled'
      };
    }
  }
}

module.exports = GeminiService;