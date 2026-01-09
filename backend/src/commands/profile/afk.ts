import { MessageContext } from '../../types/index.js';
export default {
  name: 'afk',
  category: 'profile',
  code: async (ctx: MessageContext) => {
    const { formatter, tools, database: db } = ctx.bot.context;
    const input = ctx.args.join(' ') || null;

    try {
      await db.set(`user.${ctx.getId(ctx.sender.jid)}.afk`, {
        reason: input,
        timestamp: Date.now(),
      });

      await ctx.reply(
        formatter.quote(
          `📴 Kamu akan AFK, ${input ? `dengan alasan ${formatter.inlineCode(input)}` : 'tanpa alasan apapun'}.`
        )
      );
    } catch (error: any) {
      await tools.cmd.handleError(ctx, error);
    }
  },
};
