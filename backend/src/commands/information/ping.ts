import { MessageContext } from '../../types/index.js';
import formatters from '../../utils/formatters.js';
import logger from '../../utils/logger.js';
import { performance } from 'node:perf_hooks';
const { convertMsToDuration, ucwords } = formatters;

export default {
  name: 'ping',
  category: 'information',
  code: async (ctx: MessageContext) => {
    const { formatter } = ctx.bot.context;
    try {
      const startTime = performance.now();
      const pongMsg = await ctx.reply(formatter.quote('🏓 Pong!'));
      const responseTime = performance.now() - startTime;

      if (ctx.editMessage && pongMsg?.key) {
        await ctx.editMessage(
          pongMsg.key,
          formatter.quote(`🏓 Pong! Merespon dalam ${convertMsToDuration(responseTime)}.`)
        );
      }
    } catch (error: any) {
      logger.error('Error in ping command:', error);
      await ctx.reply(formatter.quote(`An error occurred: ${error.message}`));
    }
  },
};
