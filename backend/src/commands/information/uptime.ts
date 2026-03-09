import { MessageContext } from '../../types/index.js';

export default {
    name: 'uptime',
    aliases: ['runtime'],
    category: 'information',
    description: 'Check how long the bot has been running.',
    code: async (ctx: MessageContext) => {
        const { formatter, config } = ctx.channel.context;
        await ctx.reply(formatter.quote(`🚀 Bot has been active for ${config.channel.uptime || 'unknown'}.`));
    },
};
