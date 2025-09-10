const GeminiService = require('../gemini');
const logger = require('../../utils/logger');

const gemini = new GeminiService();

module.exports = async (nlpResult, ctx, bot, context) => {
  try {
    const response = await gemini.getChatCompletion(ctx.message);
    ctx.reply(response);
  } catch (error) {
    logger.error('Error answering question with Gemini', { error });
    ctx.reply('I apologize, but I encountered an error while trying to answer your question.');
  }
};