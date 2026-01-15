import { MessageContext } from '../../types/index.js';

export default {
  name: 'afk',
  category: 'profile',
  code: async (ctx: MessageContext): Promise<void> => {
    const { databaseService, formatter, logger } = ctx.bot.context;

    if (!databaseService || !formatter) {
      await ctx.reply('❌ System Error: Service unavailable.');
      return;
    }

    try {
      const tenantId = ctx.bot.tenantId;
      const senderId = ctx.sender.jid;
      const reason = ctx.args.join(' ') || 'Tanpa alasan';

      // Update AFK status in Firestore
      const result = await databaseService.updateUser(tenantId, senderId, {
        afk: {
          reason,
          timestamp: Date.now()
        }
      });

      if (result.success) {
        await ctx.reply(formatter.quote(`💤 @${senderId.split('@')[0]} sekarang AFK dengan alasan: ${reason}`), {
          mentions: [senderId]
        });
      } else {
        throw result.error;
      }

    } catch (error: unknown) {
      const err = error instanceof Error ? error.message : String(error);
      logger.error(`[${ctx.bot.tenantId}] [AFK] Error: ${err}`, error);
      await ctx.reply(formatter.quote(`Error: ${err}`));
    }
  },
};
