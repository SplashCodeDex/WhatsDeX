import { GoogleGenerativeAI } from '@google/generative-ai';
import logger from '../utils/logger.js';
import performanceMonitor from '../utils/performanceMonitor.js';
import { Bot, GlobalContext } from '../types/index.js';

export class AIProcessor {
  private bot: Bot;
  private context: GlobalContext;
  private geminiAI: any;
  private geminiModel: any;
  private conversationMemory: Map<string, any>;

  constructor(bot: any, context: any) {
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

  async processMessage(messageData: any) {
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
    } catch (error: any) {
      this.context.logger.error('AI processing failed:', error);
      return null;
    }
  }

  async generateResponse(text: string) {
    if (!this.geminiModel) return null;
    try {
      const result = await this.geminiModel.generateContent(text);
      return result.response.text();
    } catch (err: any) {
      logger.error('Gemini error:', err);
      return null;
    }
  }

  extractText(messageData: any) {
    return messageData.message?.conversation || messageData.message?.extendedTextMessage?.text || '';
  }
}

export default AIProcessor;
