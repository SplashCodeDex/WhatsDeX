const intentRouter = require('./brain/intentRouter');
const NLPProcessorService = require('./nlpProcessor');
const ContentModerationService = require('./contentModeration');
const logger = require('../utils/logger');

class WhatsDeXBrain {
  constructor(bot, context) {
    this.bot = bot;
    this.context = context;
    this.nlp = new NLPProcessorService();
    this.moderation = new ContentModerationService();

    logger.info('WhatsDeX Brain initialized');
  }

  /**
   * Process an incoming message and decide what to do.
   *
   * @param {object} ctx The message context from the bot.
   * @returns {Promise<void>}
   */
  async processMessage(ctx) {
    const { message } = ctx;

    // 1. Moderate the message content
    const moderationResult = await this.moderation.moderateContent(message);
    if (!moderationResult.safe) {
      logger.warn('Message flagged by moderation', { moderationResult });
      return ctx.reply('Your message has been flagged for moderation.');
    }

    // 2. Process the message with NLP to understand the intent
    const nlpResult = await this.nlp.processInput(message);
    logger.info('NLP Result', { nlpResult });

    // 3. Route the message to the appropriate handler
    await intentRouter(nlpResult, ctx, this.bot, this.context);
  }
}

module.exports = WhatsDeXBrain;
