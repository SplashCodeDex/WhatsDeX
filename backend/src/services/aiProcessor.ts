import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';
import logger from '../utils/logger.js';
import performanceMonitor from '../utils/PerformanceMonitor.js';
import { Bot, GlobalContext, Result } from '../types/index.js';

/**
 * UNIFIED AI PROCESSOR
 * 2026 Mastermind Edition - Stateless & Strictly Typed
 */
export class AIProcessor {
  private context: GlobalContext;
  private geminiAI: GoogleGenerativeAI | null = null;
  private geminiModel: GenerativeModel | null = null;
  private conversationMemory: Map<string, string[]>;

  constructor(context: GlobalContext) {
    this.context = context;

    const googleConfig = this.context.config.ai?.google;

    if (!googleConfig?.geminiKey) {
      this.context.logger.warn('⚠️ Gemini API key not set - AI disabled');
    } else {
      this.geminiAI = new GoogleGenerativeAI(googleConfig.geminiKey);
      this.geminiModel = this.geminiAI.getGenerativeModel({
        model: 'gemini-1.5-flash',
      });
    }

    this.conversationMemory = new Map();
    logger.info('🧠 Unified AI Processor initialized');
  }

  /**
   * Process an incoming message through AI
   */
  async processMessage(bot: Bot, messageData: any): Promise<Result<{ response: string } | null>> {
    try {
      const text = this.extractText(messageData);

      // Basic filters: Ignore empty, commands, and bot's own prefix
      if (!text || text.startsWith('.') || text.startsWith('!') || text.startsWith('/') || text.startsWith('#')) {
        return { success: true, data: null };
      }

      const timer = performanceMonitor.startTimer('ai_processing', {
        tenantId: bot.tenantId,
        botId: bot.botId
      });

      const response = await this.generateResponse(text);

      if (response && bot && messageData.key?.remoteJid) {
        await bot.sendMessage(messageData.key.remoteJid, { text: response });
      }

      timer.end();
      return { success: true, data: response ? { response } : null };
    } catch (error: unknown) {
      const err = error instanceof Error ? error : new Error(String(error));
      this.context.logger.error(`AI processing failed [${bot.tenantId}]:`, err);
      return { success: false, error: err };
    }
  }

  /**
   * Generate a response using Gemini
   */
  async generateResponse(text: string): Promise<string | null> {
    if (!this.geminiModel) return null;
    try {
      const result = await this.geminiModel.generateContent(text);
      return result.response.text();
    } catch (err: unknown) {
      const error = err instanceof Error ? err : new Error(String(err));
      logger.error('Gemini error:', error);
      return null;
    }
  }

  private extractText(messageData: any): string {
    return messageData.message?.conversation ||
      messageData.message?.extendedTextMessage?.text ||
      messageData.message?.imageMessage?.caption ||
      messageData.message?.videoMessage?.caption ||
      '';
  }
}

export default AIProcessor;
