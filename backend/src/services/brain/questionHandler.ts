import { MessageContext, GlobalContext, Bot } from '../../types/index.js';
import GeminiService from '../gemini.js';
import logger from '../../utils/logger.js';

const gemini = new GeminiService();

export default async (nlpResult: any, ctx: MessageContext, bot: Bot, context: GlobalContext) => {
  try {
    const response = await (gemini as any).getChatCompletion(ctx.message);
    await ctx.reply(response);
  } catch (error: any) {
    logger.error('Error answering question with Gemini', { error });
    await ctx.reply('I apologize, but I encountered an error while trying to answer your question.');
  }
};
