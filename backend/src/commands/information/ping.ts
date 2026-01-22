import { MessageContext } from '../../types/index.js';
import { performance } from 'node:perf_hooks';
import logger from '../../utils/logger.js';

export default {
    name: 'ping',
    category: 'information',
    description: 'Check the bot\'s response time.',
    code: async (ctx: MessageContext) => {
        const { formatter } = ctx.bot.context;
        try {
            const startTime = performance.now();
            const pongMsg = await ctx.reply(formatter.quote('🏓 Pong!'));
            const responseTime = performance.now() - startTime;

            if (ctx.editMessage && pongMsg?.key) {
                await ctx.editMessage(
                    pongMsg.key,
                    formatter.quote(`🏓 Pong! Responded in ${responseTime.toFixed(2)}ms.`)
                );
            } else {
                await ctx.reply(formatter.quote(`🏓 Pong! Responded in ${responseTime.toFixed(2)}ms.`));
            }
        } catch (error: any) {
            logger.error('Error in ping command:', error);
            await ctx.reply(formatter.quote(`An error occurred: ${error.message}`));
        }
    },
};