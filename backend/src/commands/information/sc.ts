import { MessageContext } from '../../types/index.js';

export default {
    name: 'sc',
    aliases: ['script', 'source', 'sourcecode'],
    category: 'information',
    description: 'Get the source code link for this bot.',
    code: async (ctx: MessageContext) => {
        const { formatter, config } = ctx.bot.context;
        await ctx.reply({
            text: formatter.quote('https://github.com/SplashCodeDex/WhatsDeX'),
            footer: config.msg.footer,
        });
    },
};