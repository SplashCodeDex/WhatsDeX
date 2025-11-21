const IntelligentMessageProcessor = require('../IntelligentMessageProcessor');
const { createBotContext } = require('../utils/createBotContext');
const logger = require('../utils/logger');

/**
 * Intelligent Worker - Processes messages with AI intelligence
 */
class IntelligentWorker {
  constructor() {
    this.processor = null;
    this.processingQueue = [];
    this.isProcessing = false;
    
    logger.info('Intelligent Worker initialized');
  }

  /**
   * Initialize with bot context
   */
  async initialize(bot, context) {
    this.processor = new IntelligentMessageProcessor(bot, context);
    logger.info('Intelligent Worker ready for message processing');
  }

  /**
   * Process message with intelligent handling
   */
  async processMessage(job) {
    if (!this.processor) {
      throw new Error('Intelligent processor not initialized');
    }

    const { messageData, botContext } = job.data;
    
    try {
      // Create enhanced context for the message
      const ctx = await this.createEnhancedContext(messageData, botContext);
      
      // Process with intelligent system
      await this.processor.processMessage(ctx);
      
      logger.debug('Message processed intelligently', {
        userId: ctx.sender?.jid,
        messageType: ctx.metadata?.messageType,
        processed: true
      });
      
    } catch (error) {
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
  async createEnhancedContext(messageData, botContext) {
    const ctx = createBotContext(messageData, botContext);
    
    // Add intelligent enhancements
    ctx.intelligentMode = true;
    ctx.processingTimestamp = Date.now();
    ctx.workerVersion = 'intelligent-v2';
    
    return ctx;
  }

  /**
   * Get processing statistics
   */
  getStats() {
    return this.processor ? this.processor.getStats() : {
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
    } catch (error) {
      return {
        status: 'unhealthy',
        reason: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }
}

module.exports = new IntelligentWorker();