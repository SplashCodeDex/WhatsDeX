/**
 * UNIFIED AI PROCESSOR - Consolidates all AI systems into one robust solution
 * Combines: WhatsDeXBrain + EnhancedAIBrain + IntelligentMessageProcessor
 * With Gemini as default AI, smart filtering, and comprehensive features
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import logger from '../utils/logger.js';
import performanceMonitor from '../utils/PerformanceMonitor.js';
import { RateLimiter } from '../utils/RateLimiter.js';
import { MemoryManager } from '../utils/MemoryManager.js';

export class UnifiedAIProcessor {
  constructor(bot, context) {
    this.bot = bot;
    this.context = context;
    
    // CONSOLIDATED: Single Gemini AI instance as default
    if (!this.context.config.api.gemini) {
      console.warn('⚠️ Gemini API key not set in config.api.gemini - AI features will be disabled');
      this.geminiAI = null;
      this.geminiModel = null;
    } else {
      this.geminiAI = new GoogleGenerativeAI(this.context.config.api.gemini);
      this.geminiModel = this.geminiAI.getGenerativeModel({ 
        model: this.context.config.ai.gemini.model,
        generationConfig: this.context.config.ai.gemini.generationConfig,
      });
    }
    
    // CONSOLIDATED: Unified memory management
    this.conversationMemory = new MemoryManager({
      maxSize: 1000,
      ttl: 3600000, // 1 hour
      cleanupInterval: 300000 // 5 minutes
    });
    
    // CONSOLIDATED: Single rate limiter instance
    this.rateLimiter = new RateLimiter();
    
    // CONSOLIDATED: Smart message classification
    this.messageClassifier = new MessageClassifier();
    
    // CONSOLIDATED: Best features from all AI systems
    this.features = {
      conversationalAI: true,
      contextAwareness: true,
      smartFiltering: true,
      commandSuggestions: true,
      multiModalSupport: true,
      learningEngine: true
    };
    
    logger.info('🧠 Unified AI Processor initialized with Gemini Pro as default');
  }

  /**
   * MAIN PROCESSING METHOD - Consolidates all AI processing logic
   */
  async processMessage(messageData) {
    const startTime = performance.now();
    const timer = performanceMonitor.startTimer('ai_message_processing', {
      userId: messageData.key.remoteJid,
      messageType: messageData.type
    });

    try {
      // STEP 1: Smart message classification (prevents unnecessary AI calls)
      const classification = await this.classifyMessage(messageData);
      
      if (!classification.shouldProcessWithAI) {
        logger.debug('Message skipped by AI filter', { 
          reason: classification.reason,
          messageType: messageData.type 
        });
        return null;
      }

      // STEP 2: Rate limiting check
      const rateLimitResult = await this.rateLimiter.checkCommandRateLimit(
        messageData.key.remoteJid, 
        'ai'
      );
      
      if (!rateLimitResult.allowed) {
        await this.sendRateLimitMessage(messageData, rateLimitResult);
        return null;
      }

      // STEP 3: Process with unified AI logic
      return await this.processWithAI(messageData, classification);

    } catch (error) {
      logger.error('AI Processing error', {
        error: error.message,
        userId: messageData.key.remoteJid,
        messageType: messageData.type
      });
      
      await this.sendErrorMessage(messageData, error);
      return null;
    } finally {
      const duration = timer.end();
      logger.info('AI processing completed', {
        duration,
        userId: messageData.key.remoteJid
      });
    }
  }

  /**
   * SMART MESSAGE CLASSIFICATION - Prevents expensive AI calls
   */
  async classifyMessage(messageData) {
    const text = this.extractText(messageData);
    const userId = messageData.key.remoteJid;
    
    // Skip obvious non-AI messages
    if (!text || text.length < 3) {
      return { shouldProcessWithAI: false, reason: 'too_short' };
    }
    
    // Skip commands (they should go to command processor)
    if (this.isCommand(text)) {
      return { shouldProcessWithAI: false, reason: 'is_command' };
    }
    
    // Skip spam/repeated messages
    if (await this.isSpam(text, userId)) {
      return { shouldProcessWithAI: false, reason: 'spam_detected' };
    }
    
    // Check if user is in conversation mode
    const inConversation = await this.isInConversationMode(userId);
    
    // Detect if message needs AI (questions, complex requests, etc.)
    const needsAI = this.detectAIIntent(text);
    
    return {
      shouldProcessWithAI: inConversation || needsAI,
      confidence: needsAI ? 0.9 : 0.5,
      intent: this.detectIntent(text),
      reason: inConversation ? 'conversation_mode' : needsAI ? 'ai_intent' : 'default'
    };
  }

  /**
   * UNIFIED AI PROCESSING - Best features from all AI systems
   */
  async processWithAI(messageData, classification) {
    const text = this.extractText(messageData);
    const userId = messageData.key.remoteJid;
    
    // STEP 1: Build conversation context
    const context = await this.buildConversationContext(userId, text);
    
    // STEP 2: Process with Gemini (primary AI)
    const aiResponse = await this.generateGeminiResponse(context, classification);
    
    // STEP 3: Update conversation memory
    await this.updateConversationMemory(userId, text, aiResponse);
    
    // STEP 4: Send response
    await this.sendAIResponse(messageData, aiResponse);
    
    return aiResponse;
  }

  /**
   * GEMINI AI PROCESSING - Primary AI engine
   */
  async generateGeminiResponse(context, classification) {
    try {
      // Check if Gemini is available
      if (!this.geminiModel) {
        console.warn('⚠️ Gemini AI not available - returning fallback response');
        return {
          text: 'AI features are currently unavailable. Please check the configuration.',
          source: 'fallback'
        };
      }

      // Build enhanced prompt with context
      const prompt = this.buildEnhancedPrompt(context, classification);
      
      const result = await this.geminiModel.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      // Post-process response
      return this.postProcessResponse(text, context);
      
    } catch (error) {
      logger.error('Gemini AI error', { error: error.message });
      
      // Fallback to simple response
      return "I'm having trouble processing your message right now. Please try again later.";
    }
  }

  /**
   * CONVERSATION CONTEXT BUILDER - Enhanced context awareness
   */
  async buildConversationContext(userId, currentMessage) {
    const memory = this.conversationMemory.get(userId) || [];
    const userProfile = await this.getUserProfile(userId);
    
    return {
      currentMessage,
      conversationHistory: memory,
      userProfile,
      timestamp: new Date().toISOString(),
      contextLength: memory.length
    };
  }

  /**
   * ENHANCED PROMPT BUILDER - Smart prompt engineering
   */
  buildEnhancedPrompt(context, classification) {
    let prompt = `You are WhatsDeX, a helpful AI assistant integrated into WhatsApp. `;
    
    // Add context based on classification
    if (classification.intent === 'question') {
      prompt += `The user is asking a question. Provide a helpful and accurate answer. `;
    } else if (classification.intent === 'conversation') {
      prompt += `Continue the natural conversation with the user. `;
    }
    
    // Add conversation history if available
    if (context.conversationHistory.length > 0) {
      prompt += `\n\nConversation history:\n`;
      context.conversationHistory.slice(-6).forEach(msg => {
        prompt += `${msg}\n`;
      });
    }
    
    prompt += `\n\nUser: ${context.currentMessage}\nWhatsDeX:`;
    
    return prompt;
  }

  /**
   * SMART MESSAGE FILTERING UTILITIES
   */
  isCommand(text) {
    const commandPrefixes = ['.', '!', '/', '#'];
    return commandPrefixes.some(prefix => text.trim().startsWith(prefix));
  }

  detectAIIntent(text) {
    const aiKeywords = [
      'what', 'how', 'why', 'when', 'where', 'who',
      'explain', 'tell me', 'help', '?',
      'create', 'generate', 'write', 'make'
    ];
    
    const lowerText = text.toLowerCase();
    return aiKeywords.some(keyword => lowerText.includes(keyword));
  }

  async isSpam(text, userId) {
    const lastMessage = this.conversationMemory.get(`${userId}:last`);
    if (lastMessage && lastMessage.text === text && 
        Date.now() - lastMessage.timestamp < 5000) {
      return true; // Same message within 5 seconds
    }
    
    this.conversationMemory.set(`${userId}:last`, {
      text,
      timestamp: Date.now()
    });
    
    return false;
  }

  async isInConversationMode(userId) {
    const lastActivity = this.conversationMemory.get(`${userId}:activity`);
    if (!lastActivity) return false;
    
    return Date.now() - lastActivity < 300000; // 5 minutes
  }

  detectIntent(text) {
    if (text.includes('?')) return 'question';
    if (this.detectAIIntent(text)) return 'ai_request';
    return 'conversation';
  }

  /**
   * MEMORY MANAGEMENT - Enhanced conversation memory
   */
  async updateConversationMemory(userId, userMessage, aiResponse) {
    const memory = this.conversationMemory.get(userId) || [];
    
    memory.push(`User: ${userMessage}`);
    memory.push(`WhatsDeX: ${aiResponse}`);
    
    // Smart memory management - keep last 20 exchanges (40 items)
    if (memory.length > 40) {
      // Keep recent + summarize old
      const recent = memory.slice(-30);
      const summary = await this.summarizeOldMemory(memory.slice(0, -30));
      
      this.conversationMemory.set(userId, [summary, ...recent]);
    } else {
      this.conversationMemory.set(userId, memory);
    }
    
    // Update activity timestamp
    this.conversationMemory.set(`${userId}:activity`, Date.now());
  }

  async summarizeOldMemory(oldMemory) {
    if (oldMemory.length === 0) return null;
    
    try {
      const prompt = `Summarize this conversation history in 2-3 sentences:\n${oldMemory.join('\n')}`;
      const result = await this.geminiModel.generateContent(prompt);
      const summary = await result.response.text();
      
      return `Summary: ${summary}`;
    } catch (error) {
      return `Summary: Previous conversation with ${oldMemory.length} messages`;
    }
  }

  /**
   * RESPONSE UTILITIES
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

  postProcessResponse(text, context) {
    // Remove any unwanted prefixes or formatting
    let processed = text.trim();
    
    // Limit response length
    if (processed.length > 2000) {
      processed = processed.substring(0, 1997) + '...';
    }
    
    return processed;
  }

  async sendAIResponse(messageData, response) {
    try {
      await this.bot.sendMessage(messageData.key.remoteJid, {
        text: response
      });
    } catch (error) {
      logger.error('Failed to send AI response', { error: error.message });
    }
  }

  async sendRateLimitMessage(messageData, rateLimitResult) {
    const message = `⏰ You're sending messages too quickly. Please wait ${Math.ceil(rateLimitResult.result.resetTime / 1000)} seconds.`;
    
    await this.bot.sendMessage(messageData.key.remoteJid, {
      text: message
    });
  }

  async sendErrorMessage(messageData, error) {
    const message = "I'm experiencing some technical difficulties. Please try again later.";
    
    await this.bot.sendMessage(messageData.key.remoteJid, {
      text: message
    });
  }

  async getUserProfile(userId) {
    try {
      const user = await this.context.databaseService.getUser(userId);
      if (user) {
        return user;
      }
      // Return a default structure if user not found, to prevent errors
      return {
        id: userId,
        name: 'Unknown User',
        preferences: {},
        conversationStyle: 'default'
      };
    } catch (error) {
      logger.error(`Failed to get user profile for ${userId}:`, error);
      // Return a default structure on error
      return {
        id: userId,
        name: 'Unknown User',
        preferences: {},
        conversationStyle: 'default'
      };
    }
  }

  /**
   * HEALTH AND STATISTICS
   */
  getStats() {
    return {
      activeConversations: this.conversationMemory.size,
      aiModel: 'gemini-pro',
      featuresEnabled: this.features,
      memoryStats: this.conversationMemory.getStats()
    };
  }
}



export default UnifiedAIProcessor;