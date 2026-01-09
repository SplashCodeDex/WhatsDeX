import GeminiService from '../gemini.js';
import logger from '../../utils/logger.js';

const gemini = new GeminiService();

export default async (nlpResult, ctx, bot, context) => {
  try {
    const response = await gemini.getChatCompletion(ctx.message);
    ctx.reply(response);
  } catch (error: any) {
    logger.error('Error answering question with Gemini', { error });
    ctx.reply('I apologize, but I encountered an error while trying to answer your question.');
  }
};
