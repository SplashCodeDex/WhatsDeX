import { MessageContext } from '../../types/index.js';

export default {
    name: 'channelgroup',
    aliases: ['channelgc', 'gcchannel', 'botgroup'],
    category: 'information',
    description: 'Get the link to the channel\'s official support group.',
    code: async (ctx: MessageContext) => {
        const { formatter, config } = ctx.channel.context;
        await ctx.reply(formatter.quote(String(config.channel.groupLink || 'No group link configured.')));
    },
};
