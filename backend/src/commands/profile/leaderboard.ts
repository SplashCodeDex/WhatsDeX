import { MessageContext, BotMember } from '../../types/index.js';

export default {
  name: 'leaderboard',
  aliases: ['lb', 'top'],
  category: 'profile',
  code: async (ctx: MessageContext): Promise<void> => {
    const { databaseService, formatter, logger } = ctx.bot.context;

    if (!databaseService || !formatter) {
      await ctx.reply('❌ System Error: Service unavailable.');
      return;
    }

    try {
      const tenantId = ctx.bot.tenantId;

      // Fetch Top 10 Users from Firestore
      const topMembers = await databaseService.getLeaderboard(tenantId, 10);

      if (topMembers.length === 0) {
        await ctx.reply(formatter.quote('📭 Belum ada data leaderboard di tenant ini.'));
        return;
      }

      let lbText = `🏆 *LEADERBOARD TOP 10* 🏆\n\n`;

      topMembers.forEach((u: BotMember, index: number) => {
        const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '👤';
        const name = u.username || 'Anonymous';
        lbText += `${medal} #${index + 1} *${name}*\n`;
        lbText += `   ﹂ Level: ${u.level} | Wins: ${u.winGame} | ID: @${u.id.split('@')[0]}\n\n`;
      });

      // Try to find sender's rank
      const currentUser = await databaseService.getUser(tenantId, ctx.sender.jid);
      const top100 = await databaseService.getLeaderboard(tenantId, 100);
      const userRank = top100.findIndex((u: BotMember) => u.id === ctx.sender.jid) + 1;

      if (userRank > 10) {
        lbText += `--- Peringkat Kamu ---\n`;
        lbText += `#${userRank} *${currentUser?.username || 'Kamu'}*\n`;
        lbText += `   ﹂ Level: ${currentUser?.level || 0} | Wins: ${currentUser?.winGame || 0}\n`;
      }

      await ctx.reply({
        text: formatter.quote(lbText),
        mentions: topMembers.map(u => u.id).concat(userRank > 10 ? [ctx.sender.jid] : [])
      });

    } catch (error: unknown) {
      const err = error instanceof Error ? error.message : String(error);
      logger.error(`[${ctx.bot.tenantId}] [Leaderboard] Error: ${err}`, error);
      await ctx.reply(formatter.quote(`Error: ${err}`));
    }
  },
};
