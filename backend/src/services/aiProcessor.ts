import { GoogleGenerativeAI } from '@google/generative-ai';
import logger from '../utils/logger';
import performanceMonitor from '../utils/PerformanceMonitor';

export class AIProcessor {
  constructor(bot, context) {
    this.bot = bot;
    this.context = context;

    const googleConfig = this.context.config.ai?.google;

    if (!googleConfig?.apiKey) {
      this.context.logger.warn('⚠️ Gemini API key not set - AI disabled');
      this.geminiAI = null;
    } else {
      this.geminiAI = new GoogleGenerativeAI(googleConfig.apiKey);
      this.geminiModel = this.geminiAI.getGenerativeModel({
        model: googleConfig.model || 'gemini-pro',
      });
    }

    this.conversationMemory = new Map();
    logger.info('🧠 Unified AI Processor initialized (Prisma/Redis removed)');
  }

  async processMessage(messageData) {
    try {
      const text = this.extractText(messageData);
      if (!text || text.startsWith('.') || text.startsWith('!')) return null;

      const timer = performanceMonitor.startTimer('ai_processing');

      const response = await this.generateResponse(text);
      if (response && this.bot) {
        await this.bot.sendMessage(messageData.key.remoteJid, { text: response });
      }

      timer.end();
      return { success: true, response };
    } catch (error) {
      this.context.logger.error('AI processing failed:', error);
      return null;
    }
  }

  async generateResponse(text) {
    if (!this.geminiModel) return null;
    try {
      const result = await this.geminiModel.generateContent(text);
      return result.response.text();
    } catch (err) {
      logger.error('Gemini error:', err);
      return null;
    }
  }

  extractText(messageData) {
    return messageData.message?.conversation || messageData.message?.extendedTextMessage?.text || '';
  }
}

export default AIProcessor;
