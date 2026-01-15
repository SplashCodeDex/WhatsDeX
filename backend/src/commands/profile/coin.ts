import { MessageContext } from '../../types/index.js';

export default {
  name: 'coin',
  aliases: ['koin'],
  category: 'profile',
  code: async (ctx: MessageContext): Promise<void> => {
    const { databaseService, formatter, logger } = ctx.bot.context;

    if (!databaseService || !formatter) {
      await ctx.reply('❌ System Error: Service unavailable.');
      return;
    }

    try {
      const senderId = ctx.sender.jid;
      const tenantId = ctx.bot.tenantId;

      // Check Owner using Context
      if (ctx.sender.isOwner) {
        await ctx.reply(formatter.quote('🤑 Kamu memiliki koin tak terbatas.'));
        return;
      }

      // Fetch User Data from Firestore (Multi-tenant scoped)
      const user = await databaseService.getUser(tenantId, senderId);

      if (user?.premium) {
        await ctx.reply(formatter.quote('🤑 Kamu memiliki koin tak terbatas.'));
        return;
      }

      const userCoin = user?.coin || 0;

      await ctx.reply(formatter.quote(`💰 Kamu memiliki ${userCoin} koin tersisa.`));

    } catch (error: unknown) {
      const err = error instanceof Error ? error.message : String(error);
      logger.error(`[${ctx.bot.tenantId}] [Coin] Error: ${err}`, error);
      await ctx.reply(formatter.quote(`Error: ${err}`));
    }
  },
};
