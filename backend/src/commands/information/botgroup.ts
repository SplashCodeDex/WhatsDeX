import { MessageContext } from '../../types/index.js';

export default {
    name: 'botgroup',
    aliases: ['botgc', 'gcbot'],
    category: 'information',
    description: 'Get the link to the bot\'s official support group.',
    code: async (ctx: MessageContext) => {
        const { formatter, config } = ctx.bot.context;
        await ctx.reply(formatter.quote(String(config.bot.groupLink || 'No group link configured.')));
    },
};