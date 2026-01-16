import { EnhancedAIBrain } from '../services/index.js';
import { createBotContext } from '../utils/createBotContext.js';
import logger from '../utils/logger.js';
import { Bot, GlobalContext } from '../types/index.js';

/**
 * Intelligent Worker - Processes messages with AI intelligence
 */
class IntelligentWorker {
  private processor: EnhancedAIBrain | null = null;
  private bot: Bot | null = null;
  private context: GlobalContext | null = null;

  constructor() {
    logger.info('Intelligent Worker initialized');
  }

  /**
   * Initialize with bot context
   */
  async initialize(bot: Bot, context: GlobalContext) {
    this.bot = bot;
    this.context = context;
    this.processor = new EnhancedAIBrain(context);
    logger.info('Intelligent Worker ready for message processing');
  }

  /**
   * Process message with intelligent handling
   */
  async processMessage(job: any) {
    if (!this.processor) {
      throw new Error('Intelligent processor not initialized');
    }
    if (!this.bot) {
      throw new Error('Bot not initialized');
    }

    const { messageData, botContext } = job.data;

    try {
      // Create enhanced context for the message
      const ctx = await this.createEnhancedContext(messageData, botContext);

      // Process with intelligent system
      await this.processor.processMessage(this.bot, ctx);

      logger.debug('Message processed intelligently', {
        userId: ctx.sender?.jid,
        processed: true
      });

    } catch (error: any) {
      logger.error('Intelligent processing failed:', {
        error: error.message,
        messageData: JSON.stringify(messageData, null, 2).substring(0, 500)
      });
      throw error;
    }
  }

  /**
   * Create enhanced context from message data
   */
  async createEnhancedContext(messageData: any, botContext: any) {
    if (!this.context) throw new Error('Global context not initialized');

    const ctx = await createBotContext(this.bot, messageData, this.context);

    // Add intelligent enhancements
    ctx.intelligentMode = true;
    ctx.processingTimestamp = Date.now();
    ctx.workerVersion = 'intelligent-v3';

    return ctx;
  }

  /**
   * Get processing statistics
   */
  getStats() {
    // EnhancedAIBrain doesn't have getStats yet, adding a basic placeholder
    return this.processor ? { status: 'active' } : {
      status: 'not_initialized'
    };
  }

  /**
   * Health check
   */
  async healthCheck() {
    if (!this.processor) {
      return { status: 'unhealthy', reason: 'processor_not_initialized' };
    }

    try {
      const stats = this.getStats();
      return {
        status: 'healthy',
        stats,
        timestamp: new Date().toISOString()
      };
    } catch (error: any) {
      return {
        status: 'unhealthy',
        reason: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }
}

export default new IntelligentWorker();
