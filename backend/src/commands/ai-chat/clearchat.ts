import { MessageContext } from '../../types/index.js';
export default {
  name: 'clearchat',
  aliases: ['cchat', 'cleangpt'],
  category: 'ai-chat',
  permissions: {
    coin: 0,
  },
  code: async (ctx: MessageContext) => {
    const { database, formatter } = ctx.bot.context;
    const userId = ctx.author.id;

    try {
      database.chat.clearHistory(userId);
      await ctx.reply(formatter.quote('✅ Your chat history has been cleared.'));
    } catch (error: any) {
      const {
        config,
        tools: { cmd },
      } = ctx.bot.context;
      await cmd.handleError(config, ctx, error, true);
    }
  },
};
