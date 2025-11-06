const EnhancedAIBrain = require('./services/EnhancedAIBrain');
const logger = require('./utils/logger');

/**
 * Intelligent Message Processor - Routes ALL messages through AI intelligence
 * No more rigid command parsing - everything is handled intelligently
 */
class IntelligentMessageProcessor {
  constructor(bot, context) {
    this.bot = bot;
    this.context = context;
    this.aiBrain = new EnhancedAIBrain(bot, context);
    this.middlewareStack = [];
    this.processingStats = {
      totalMessages: 0,
      aiProcessed: 0,
      commandExecuted: 0,
      conversational: 0,
      errors: 0
    };
    
    logger.info('Intelligent Message Processor initialized');
  }

  /**
   * Process ANY incoming message with AI intelligence
   */
  async processMessage(ctx) {
    this.processingStats.totalMessages++;
    
    try {
      // Apply middleware stack first
      const middlewareResult = await this.applyMiddleware(ctx);
      if (!middlewareResult.continue) {
        return;
      }

      // Enhanced message preprocessing
      const processedCtx = await this.preprocessMessage(ctx);
      
      // Route to AI Brain for intelligent handling
      await this.aiBrain.processMessage(processedCtx);
      
      this.processingStats.aiProcessed++;
      
    } catch (error) {
      this.processingStats.errors++;
      logger.error('Message processing failed:', {
        error: error.message,
        userId: ctx.sender?.jid,
        message: ctx.message?.substring(0, 100)
      });
      
      await this.handleProcessingError(ctx, error);
    }
  }

  /**
   * Preprocess message to add intelligence context
   */
  async preprocessMessage(ctx) {
    const enhanced = { ...ctx };
    
    // Normalize message content
    enhanced.message = this.normalizeMessage(ctx);
    
    // Add metadata
    enhanced.metadata = {
      timestamp: Date.now(),
      messageType: this.detectMessageType(ctx),
      urgency: this.detectUrgency(ctx.message),
      language: await this.detectLanguage(ctx.message),
      hasMedia: !!(ctx.image || ctx.video || ctx.audio || ctx.document),
      mediaTypes: this.getMediaTypes(ctx)
    };
    
    // Add conversation context
    enhanced.conversationContext = await this.buildConversationContext(ctx);
    
    return enhanced;
  }

  /**
   * Normalize message content from various sources
   */
  normalizeMessage(ctx) {
    // Priority order for message content
    return ctx.message || 
           ctx.text || 
           ctx.caption || 
           ctx.body || 
           (ctx.quoted?.content) ||
           (ctx.image ? '[Image]' : '') ||
           (ctx.video ? '[Video]' : '') ||
           (ctx.audio ? '[Audio]' : '') ||
           (ctx.document ? '[Document]' : '') ||
           '[Unknown content]';
  }

  /**
   * Detect message type for intelligent processing
   */
  detectMessageType(ctx) {
    if (ctx.image) return 'image';
    if (ctx.video) return 'video';
    if (ctx.audio) return 'audio';
    if (ctx.document) return 'document';
    if (ctx.sticker) return 'sticker';
    if (ctx.quoted) return 'reply';
    
    const message = this.normalizeMessage(ctx);
    
    // Pattern-based detection
    if (/^[.!\/]/.test(message)) return 'command';
    if (/\?$/.test(message)) return 'question';
    if (/^(hi|hello|hey|good morning|good evening)/i.test(message)) return 'greeting';
    if (/^(bye|goodbye|see you|good night)/i.test(message)) return 'farewell';
    if (/(download|get|fetch).*(youtube|tiktok|instagram|video)/i.test(message)) return 'download_request';
    if (/(create|generate|make).*(image|picture|photo)/i.test(message)) return 'generation_request';
    if (/(search|find|look).*(for|up)/i.test(message)) return 'search_request';
    if (/(weather|temperature|forecast)/i.test(message)) return 'weather_request';
    if (/(translate|translation)/i.test(message)) return 'translation_request';
    
    return 'conversational';
  }

  /**
   * Detect message urgency for prioritization
   */
  detectUrgency(message) {
    const urgentWords = ['urgent', 'emergency', 'asap', 'quickly', 'immediately', 'help', 'problem'];
    const normalizedMessage = message.toLowerCase();
    
    for (const word of urgentWords) {
      if (normalizedMessage.includes(word)) {
        return 'high';
      }
    }
    
    if (message.includes('!') || message.includes('?!')) {
      return 'medium';
    }
    
    return 'normal';
  }

  /**
   * Simple language detection
   */
  async detectLanguage(message) {
    // Basic pattern-based language detection
    const patterns = {
      'id': /\b(saya|aku|kamu|dengan|untuk|dari|ke|ini|itu|yang|dan|atau|tidak|ya|apa|siapa|kapan|dimana|bagaimana)\b/i,
      'es': /\b(yo|tu|el|ella|con|para|de|a|este|ese|que|y|o|no|si|que|quien|cuando|donde|como)\b/i,
      'fr': /\b(je|tu|il|elle|avec|pour|de|à|ce|cette|que|et|ou|non|oui|qui|quand|où|comment)\b/i,
      'pt': /\b(eu|você|ele|ela|com|para|de|para|este|esse|que|e|ou|não|sim|quem|quando|onde|como)\b/i,
      'ar': /[\u0600-\u06FF]/,
      'zh': /[\u4e00-\u9fff]/,
      'ja': /[\u3040-\u309f\u30a0-\u30ff]/,
      'ko': /[\uac00-\ud7af]/,
      'hi': /[\u0900-\u097f]/,
      'th': /[\u0e00-\u0e7f]/,
      'vi': /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i
    };
    
    for (const [lang, pattern] of Object.entries(patterns)) {
      if (pattern.test(message)) {
        return lang;
      }
    }
    
    return 'en'; // Default to English
  }

  /**
   * Get media types present in message
   */
  getMediaTypes(ctx) {
    const types = [];
    if (ctx.image) types.push('image');
    if (ctx.video) types.push('video');
    if (ctx.audio) types.push('audio');
    if (ctx.document) types.push('document');
    if (ctx.sticker) types.push('sticker');
    return types;
  }

  /**
   * Build conversation context for intelligent responses
   */
  async buildConversationContext(ctx) {
    const userId = ctx.sender?.jid;
    if (!userId) return {};
    
    return {
      isNewConversation: !this.aiBrain.conversationMemory.has(userId),
      messageCount: this.aiBrain.conversationMemory.get(userId)?.length || 0,
      lastInteraction: this.getLastInteractionTime(userId),
      conversationTopic: await this.inferConversationTopic(userId),
      userMood: await this.inferUserMood(ctx),
      contextualCues: this.extractContextualCues(ctx)
    };
  }

  /**
   * Apply middleware stack with intelligent filtering
   */
  async applyMiddleware(ctx) {
    // Get middleware from the existing middleware system
    const middlewareList = [
      'botMode',
      'inputValidation', 
      'groupMute',
      'nightMode',
      'maliciousMessage',
      'antiSpam',
      'rateLimiter'
    ];
    
    for (const middlewareName of middlewareList) {
      try {
        const middleware = require(`../middleware/${middlewareName}`);
        const result = await middleware(ctx, this.bot, this.context);
        
        if (result === false) {
          logger.debug(`Message blocked by ${middlewareName} middleware`);
          return { continue: false, reason: middlewareName };
        }
      } catch (error) {
        logger.warn(`Middleware ${middlewareName} failed:`, error.message);
        // Continue processing even if middleware fails
      }
    }
    
    return { continue: true };
  }

  /**
   * Handle processing errors gracefully
   */
  async handleProcessingError(ctx, error) {
    logger.error('Processing error details:', {
      error: error.message,
      stack: error.stack,
      userId: ctx.sender?.jid,
      isGroup: ctx.isGroup,
      messageType: this.detectMessageType(ctx)
    });
    
    // Intelligent error response based on error type
    let errorResponse = "I apologize, but I'm experiencing some technical difficulties right now.";
    
    if (error.message.includes('rate limit')) {
      errorResponse = "You're sending messages quite quickly! Please give me a moment to catch up.";
    } else if (error.message.includes('network') || error.message.includes('timeout')) {
      errorResponse = "I'm having trouble connecting to my services. Please try again in a moment.";
    } else if (error.message.includes('permission')) {
      errorResponse = "I don't have the necessary permissions to complete that action.";
    } else if (error.message.includes('quota') || error.message.includes('limit')) {
      errorResponse = "I've reached my usage limit for now. Please try again later.";
    }
    
    try {
      await ctx.reply(errorResponse);
    } catch (replyError) {
      logger.error('Failed to send error response:', replyError);
    }
  }

  /**
   * Get processing statistics
   */
  getStats() {
    return {
      ...this.processingStats,
      uptime: Date.now() - this.startTime,
      messagesPerMinute: this.processingStats.totalMessages / ((Date.now() - this.startTime) / 60000),
      errorRate: this.processingStats.errors / this.processingStats.totalMessages,
      aiProcessingRate: this.processingStats.aiProcessed / this.processingStats.totalMessages
    };
  }

  // Helper methods (simplified implementations)
  getLastInteractionTime(userId) {
    const memory = this.aiBrain.conversationMemory.get(userId);
    return memory && memory.length > 0 ? memory[memory.length - 1].timestamp : null;
  }

  async inferConversationTopic(userId) {
    const memory = this.aiBrain.conversationMemory.get(userId);
    if (!memory || memory.length === 0) return 'general';
    
    // Simple topic inference based on recent messages
    const recentMessages = memory.slice(-5).map(m => m.user).join(' ');
    
    if (/download|video|youtube/i.test(recentMessages)) return 'media_download';
    if (/image|picture|generate/i.test(recentMessages)) return 'image_generation';
    if (/weather|temperature/i.test(recentMessages)) return 'weather';
    if (/game|play|quiz/i.test(recentMessages)) return 'entertainment';
    if (/search|find|google/i.test(recentMessages)) return 'information_search';
    
    return 'general';
  }

  async inferUserMood(ctx) {
    const message = this.normalizeMessage(ctx);
    
    // Simple mood detection
    if (/!{2,}|excited|awesome|great|love/i.test(message)) return 'excited';
    if (/\?{2,}|confused|help|don.*understand/i.test(message)) return 'confused';
    if (/please|thank|appreciate/i.test(message)) return 'polite';
    if (/angry|frustrated|hate|terrible/i.test(message)) return 'frustrated';
    if (/sad|sorry|disappointed/i.test(message)) return 'sad';
    
    return 'neutral';
  }

  extractContextualCues(ctx) {
    const message = this.normalizeMessage(ctx);
    const cues = [];
    
    if (ctx.quoted) cues.push('replying_to_message');
    if (ctx.isGroup) cues.push('group_conversation');
    if (/urgent|asap|quickly/i.test(message)) cues.push('urgent_request');
    if (/please|could you|would you/i.test(message)) cues.push('polite_request');
    if (/\?/.test(message)) cues.push('asking_question');
    if (/thanks|thank you|thx/i.test(message)) cues.push('expressing_gratitude');
    
    return cues;
  }
}

module.exports = IntelligentMessageProcessor;