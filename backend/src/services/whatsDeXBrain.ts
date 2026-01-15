import intentRouter from './brain/intentRouter.js';
import NLPProcessorService, { NLPResult } from './nlpProcessor.js';
import ContentModerationService from './contentModeration.js';
import MetaAIService from './metaAI.js';
import logger from '../utils/logger.js';
// RAG Architecture Services
import memoryService from './memoryService.js';
import embeddingService from './embeddingService.js';
import { Bot, GlobalContext, MessageContext } from '../types/index.js';

interface ManagedMemory {
  get: (userId: string) => string[];
  set: (userId: string, data: string[]) => void;
  delete: (userId: string) => void;
  size: () => number;
  cleanup: () => void;
}

class WhatsDeXBrain {
  private bot: Bot;
  private context: GlobalContext;
  private nlp: NLPProcessorService;
  private moderation: ContentModerationService;
  private metaAI: MetaAIService;
  private conversationMemory: ManagedMemory;

  constructor(bot: Bot, context: GlobalContext) {
    this.bot = bot;
    this.context = context;
    this.nlp = new NLPProcessorService();
    this.moderation = new ContentModerationService();
    this.metaAI = new MetaAIService(this.context.config.get('META_AI_KEY' as any));
    // Replace unbounded Map with managed memory system
    this.conversationMemory = this.initializeManagedMemory();

    logger.info('WhatsDeX Brain initialized with Meta AI');

    // Start memory cleanup timer
    this.startMemoryCleanup();
  }

  /**
   * Process an incoming message and decide what to do.
   *
   * @param {object} ctx The message context from the bot.
   * @returns {Promise<void>}
   */
  async processMessage(ctx: MessageContext) {
    const message = ctx.body || '';
    const userId = ctx.sender.jid;

    // 1. Moderate the message content
    const moderationResult = await this.moderation.moderateContent(message);
    if (moderationResult && !(moderationResult as any).safe) {
      logger.warn('Message flagged by moderation', { moderationResult });
      return ctx.reply('Your message has been flagged for moderation.');
    }

    // 2. Process the message with NLP to understand the intent
    const nlpResult = await this.nlp.processInput(message, {
      userId,
      recentCommands: [], // Should fetch from DB if needed
      isGroup: ctx.isGroup(),
      isAdmin: ctx.isGroup() ? await ctx.group().isAdmin(ctx.sender.jid) : false,
      isOwner: false, // Placeholder
    });
    logger.info('NLP Result', { nlpResult });

    // 3. Check if this is a conversational query that needs AI
    if (this.isConversationalQuery(nlpResult)) {
      await this.handleConversationalAI(ctx, nlpResult);
      return;
    }

    // 4. Route the message to the appropriate handler
    await intentRouter(nlpResult, ctx, this.bot, this.context);
  }

  /**
   * Determine if a query should be handled by conversational AI
   */
  isConversationalQuery(nlpResult: NLPResult) {
    if (!nlpResult) return true;
    const conversationalIntents = ['question', 'chat', 'help', 'general'];
    return conversationalIntents.includes(nlpResult.intent) || nlpResult.confidence < 0.8; // Low confidence = conversational
  }

  /**
   * Handle conversational AI interactions with RAG-enhanced memory
   */
  async handleConversationalAI(ctx: MessageContext, nlpResult: NLPResult) {
    const userId = ctx.sender.jid;
    const currentMessage = ctx.body || '';

    try {
      // Get recent memory (sliding window)
      const recentMemory = this.getConversationMemory(userId);

      // RAG: Retrieve relevant historical context
      const historicalContext = await this.retrieveHistoricalContext(userId, currentMessage);

      // Build enhanced prompt with both recent and historical context
      const enhancedPrompt = this.buildContextualPrompt(currentMessage, recentMemory, historicalContext, nlpResult);

      // Generate AI response with enhanced context
      const aiResponse = await this.metaAI.generateReply(enhancedPrompt);

      // Update recent memory
      this.updateConversationMemory(userId, currentMessage, aiResponse);

      // Store conversation in RAG vector database (async, non-blocking)
      this.storeConversationAsync(userId, currentMessage, aiResponse, nlpResult);

      await ctx.reply(aiResponse);
    } catch (error: any) {
      logger.error('Conversational AI error:', error);
      await ctx.reply("Sorry, I'm having trouble processing your request right now.");
    }
  }

  /**
   * Get conversation memory for a user (with TTL check)
   */
  getConversationMemory(userId: string): string[] {
    return this.conversationMemory.get(userId) || [];
  }

  /**
   * Initialize managed memory system with TTL and size limits
   */
  initializeManagedMemory(): ManagedMemory {
    const memory = new Map<string, string[]>();
    const maxUsers = 1000;
    const userTTL = 3600000; // 1 hour
    const accessTimes = new Map<string, number>();

    // Enhanced memory management wrapper
    return {
      get: (userId: string) => {
        const user = memory.get(userId);
        if (!user) return [];

        // Check TTL
        const accessTime = accessTimes.get(userId);
        if (accessTime && Date.now() - accessTime > userTTL) {
          memory.delete(userId);
          accessTimes.delete(userId);
          return [];
        }

        // Update access time
        accessTimes.set(userId, Date.now());
        return user;
      },

      set: (userId: string, data: string[]) => {
        // Evict oldest if at capacity
        if (memory.size >= maxUsers) {
          this.evictOldestMemory(memory, accessTimes);
        }

        memory.set(userId, data);
        accessTimes.set(userId, Date.now());
      },

      delete: (userId: string) => {
        memory.delete(userId);
        accessTimes.delete(userId);
      },

      size: () => memory.size,

      cleanup: () => {
        const now = Date.now();
        for (const [userId, accessTime] of accessTimes) {
          if (now - accessTime > userTTL) {
            memory.delete(userId);
            accessTimes.delete(userId);
          }
        }
      }
    };
  }

  /**
   * Evict oldest memory entry (LRU eviction)
   */
  evictOldestMemory(memory: Map<string, any>, accessTimes: Map<string, number>) {
    let oldestUser = null;
    let oldestTime = Date.now();

    for (const [userId, time] of accessTimes) {
      if (time < oldestTime) {
        oldestTime = time;
        oldestUser = userId;
      }
    }

    if (oldestUser) {
      memory.delete(oldestUser);
      accessTimes.delete(oldestUser);
      logger.info(`Evicted oldest memory for user: ${oldestUser}`);
    }
  }

  /**
   * Update conversation memory with size and TTL limits
   */
  updateConversationMemory(userId: string, userMessage: string, aiResponse: string) {
    const memory = this.getConversationMemory(userId);
    memory.push(`User: ${userMessage}`);
    memory.push(`AI: ${aiResponse}`);

    // CORRECTED: Keep only last 10 exchanges (20 items = 10 user+AI pairs)
    if (memory.length > 20) {
      memory.splice(0, memory.length - 20); // Keep last 20 items = 10 exchanges
    }

    // Use managed memory instead of direct Map
    this.conversationMemory.set(userId, memory);

    // Log memory usage for monitoring
    if (this.conversationMemory.size() % 100 === 0) {
      logger.info(`Memory usage: ${this.conversationMemory.size()} active conversations`);
    }
  }

  /**
   * Get conversation memory for a user from database (async)
   */
  async getConversationMemoryDB(userId: string) {
    try {
      // Transitioning to Firebase/Firestore
      // For now, fall back to in-memory managed system
      return this.getConversationMemory(userId);
    } catch (error: any) {
      logger.error('Error retrieving conversation memory:', error);
      return this.getConversationMemory(userId);
    }
  }

  /**
   * Update conversation memory in database (async)
   */
  async updateConversationMemoryDB(userId: string, userMessage: string, aiResponse: string) {
    try {
      // Transitioning to Firebase/Firestore
      // For now, update in-memory managed system
      this.updateConversationMemory(userId, userMessage, aiResponse);
    } catch (error: any) {
      logger.error('Error updating conversation memory:', error);
      this.updateConversationMemory(userId, userMessage, aiResponse);
    }
  }

  /**
   * Start periodic memory cleanup to prevent memory leaks
   */
  startMemoryCleanup() {
    // Clean up every 5 minutes
    setInterval(() => {
      this.conversationMemory.cleanup();
      logger.info(`Memory cleanup completed. Active conversations: ${this.conversationMemory.size()}`);
    }, 300000);
  }

  /**
   * Get memory statistics
   */
  getMemoryStats() {
    return {
      activeConversations: this.conversationMemory.size(),
      maxCapacity: 1000,
      memoryUsage: (this.conversationMemory.size() / 1000) * 100
    };
  }

  /**
   * RAG: Retrieve relevant historical context using vector similarity search
   */
  async retrieveHistoricalContext(userId: string, currentMessage: string) {
    try {
      const result = await memoryService.retrieveRelevantContext(userId, currentMessage);
      if (result.success) {
        return result.data;
      }
      return [];
    } catch (error: any) {
      logger.error('Error retrieving historical context:', error);
      return []; // Graceful fallback - continue without historical context
    }
  }

  /**
   * RAG: Build enhanced prompt with recent memory and historical context
   */
  buildContextualPrompt(currentMessage: string, recentMemory: string[], historicalContext: any[], nlpResult: NLPResult) {
    let prompt = '';

    // Add historical context if available
    if (historicalContext.length > 0) {
      prompt += 'Relevant past conversations:\n';
      historicalContext.forEach((context, index) => {
        const similarity = (context.similarity * 100).toFixed(1);
        prompt += `${index + 1}. [${similarity}% relevant] ${context.content}\n`;
      });
      prompt += '\n';
    }

    // Add recent conversation memory
    if (recentMemory.length > 0) {
      prompt += `Recent conversation: ${recentMemory.join(' | ')}\n\n`;
    }

    // Add current context
    prompt += `Current message: ${currentMessage}\n`;
    prompt += `Intent: ${nlpResult?.intent || 'unknown'}\n`;
    prompt += `Confidence: ${nlpResult?.confidence || 0}\n\n`;

    // Instructions for AI
    prompt += 'Instructions:\n';
    prompt += '- Use the historical context to understand the user\'s background and preferences\n';
    prompt += '- Maintain conversation continuity by referencing relevant past discussions\n';
    prompt += '- Be helpful, contextual, and personalized based on the conversation history\n';
    prompt += '- If historical context is relevant, acknowledge it naturally in your response\n\n';

    prompt += 'Respond helpfully and contextually:';

    return prompt;
  }

  /**
   * RAG: Store conversation in vector database asynchronously
   */
  storeConversationAsync(userId: string, userMessage: string, aiResponse: string, nlpResult: NLPResult) {
    const setImmediate = (globalThis as any).setImmediate || ((fn: any) => setTimeout(fn, 0));
    // Use setImmediate for non-blocking async operation
    setImmediate(async () => {
      try {
        const conversationText = `User: ${userMessage}\nAI: ${aiResponse}`;
        const metadata = {
          intent: nlpResult?.intent || 'unknown',
          confidence: nlpResult?.confidence || 0,
          timestamp: new Date().toISOString(),
          messageLength: userMessage.length,
          responseLength: aiResponse.length
        };

        await memoryService.storeConversation(userId, conversationText, metadata);
        logger.debug(`Stored conversation embedding for user ${userId}`);
      } catch (error: any) {
        logger.error('Error storing conversation embedding:', error);
        // Don't throw - this is background operation
      }
    });
  }

  /**
   * RAG: Get conversation statistics including vector database
   */
  async getEnhancedMemoryStats(userId: string | null = null) {
    const baseStats = this.getMemoryStats();

    try {
      if (userId) {
        const userStats = await memoryService.getConversationStats(userId);
        return {
          ...baseStats,
          userConversationHistory: userStats
        };
      }

      return baseStats;
    } catch (error: any) {
      logger.error('Error getting enhanced memory stats:', error);
      return baseStats;
    }
  }
}

export default WhatsDeXBrain;
