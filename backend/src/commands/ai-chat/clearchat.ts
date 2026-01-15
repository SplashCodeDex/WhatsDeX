import { MessageContext } from '../../types/index.js';
export default {
  name: 'clearchat',
  aliases: ['cchat', 'cleangpt'],
  category: 'ai-chat',
  permissions: {
    coin: 0,
  },
  code: async (ctx: MessageContext) => {
    const { database, formatter, tools } = ctx.bot.context;
    const userId = ctx.sender.jid;

    try {
      await database.chat.clearHistory(userId, ctx.bot.tenantId);
      await ctx.reply(formatter.quote('✅ Your chat history has been cleared.'));
    } catch (error: unknown) {
      await tools.cmd.handleError(ctx, error);
    }
  },
};
