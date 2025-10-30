const intentRouter = require('./brain/intentRouter');
const NLPProcessorService = require('./nlpProcessor');
const ContentModerationService = require('./contentModeration');
const MetaAIService = require('./metaAI');
const logger = require('../utils/logger');

class WhatsDeXBrain {
  constructor(bot, context) {
    this.bot = bot;
    this.context = context;
    this.nlp = new NLPProcessorService();
    this.moderation = new ContentModerationService();
    this.metaAI = new MetaAIService(process.env.META_AI_KEY);
    this.conversationMemory = new Map(); // In-memory for now, will be replaced with DB

    logger.info('WhatsDeX Brain initialized with Meta AI');
  }

  /**
   * Process an incoming message and decide what to do.
   *
   * @param {object} ctx The message context from the bot.
   * @returns {Promise<void>}
   */
  async processMessage(ctx) {
    const { message } = ctx;
    const userId = ctx.sender.jid;

    // 1. Moderate the message content
    const moderationResult = await this.moderation.moderateContent(message);
    if (!moderationResult.safe) {
      logger.warn('Message flagged by moderation', { moderationResult });
      return ctx.reply('Your message has been flagged for moderation.');
    }

    // 2. Process the message with NLP to understand the intent
    const nlpResult = await this.nlp.processInput(message);
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
  isConversationalQuery(nlpResult) {
    const conversationalIntents = ['question', 'chat', 'help', 'general'];
    return conversationalIntents.includes(nlpResult.intent) ||
           nlpResult.confidence < 0.8; // Low confidence = conversational
  }

  /**
   * Handle conversational AI interactions with memory
   */
  async handleConversationalAI(ctx, nlpResult) {
    const userId = ctx.sender.jid;
    const memory = this.getConversationMemory(userId);

    try {
      const prompt = `Previous conversation: ${memory.join(' | ')}\nCurrent message: ${ctx.message}\nIntent: ${nlpResult.intent}\nRespond helpfully and contextually.`;
      const aiResponse = await this.metaAI.generateReply(prompt);

      // Update memory
      this.updateConversationMemory(userId, ctx.message, aiResponse);

      await ctx.reply(aiResponse);
    } catch (error) {
      logger.error('Conversational AI error:', error);
      await ctx.reply('Sorry, I\'m having trouble processing your request right now.');
    }
  }

  /**
   * Get conversation memory for a user
   */
  getConversationMemory(userId) {
    return this.conversationMemory.get(userId) || [];
  }

  /**
   * Update conversation memory
   */
  updateConversationMemory(userId, userMessage, aiResponse) {
    const memory = this.getConversationMemory(userId);
    memory.push(`User: ${userMessage}`);
    memory.push(`AI: ${aiResponse}`);

    // Keep only last 10 exchanges
    if (memory.length > 20) {
      memory.splice(0, memory.length - 20);
    }

    this.conversationMemory.set(userId, memory);
  }
  /**
   * Get conversation memory for a user from database (async)
   */
  async getConversationMemoryDB(userId) {
    try {
      const context = require('../../context');
      const memory = await context.database.ConversationMemory.findMany({
        where: { userId },
        orderBy: { lastUpdated: 'desc' },
        take: 1
      });

      if (memory.length > 0) {
        return JSON.parse(memory[0].messages);
      }
      return [];
    } catch (error) {
      console.error('Error retrieving conversation memory:', error);
      return this.getConversationMemory(userId); // Fallback to in-memory
    }
  }

  /**
   * Update conversation memory in database (async)
   */
  async updateConversationMemoryDB(userId, userMessage, aiResponse) {
    try {
      const context = require('../../context');
      const memory = await this.getConversationMemoryDB(userId);
      memory.push(`User: ${userMessage}`);
      memory.push(`AI: ${aiResponse}`);

      // Keep only last 20 exchanges
      const trimmedMemory = memory.length > 40 ? memory.slice(-40) : memory;

      await context.database.ConversationMemory.upsert({
        where: {
          id: `${userId}-memory` // Simple composite key
        },
        update: {
          messages: JSON.stringify(trimmedMemory),
          lastUpdated: new Date()
        },
        create: {
          id: `${userId}-memory`,
          userId,
          messages: JSON.stringify(trimmedMemory),
          lastUpdated: new Date()
        }
      });
    } catch (error) {
      console.error('Error updating conversation memory:', error);
      // Fallback to in-memory update
      this.updateConversationMemory(userId, userMessage, aiResponse);
    }
  }
}

module.exports = WhatsDeXBrain;
