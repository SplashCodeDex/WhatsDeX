import { MessageContext } from '../../types/index.js';
import util from 'node:util';

export default {
  name: 'eval',
  aliases: ['ev'],
  code: async (ctx: MessageContext) => {
    const { formatter, tools } = ctx.bot.context;
    const isOwner = await tools.cmd.isOwner(ctx.bot.context.config, ctx.getId(ctx.sender.jid), ctx.msg.key.id, ctx.botInstanceId);
    if (!isOwner) return;

    try {
      const code = ctx.msg.content.slice(ctx.msg.content.startsWith('==> ') ? 4 : 3);
      const result = await eval(
        ctx.msg.content.startsWith('==> ') ? `(async () => { ${code} })()` : code
      );

      await ctx.reply(formatter.monospace(util.inspect(result)));
    } catch (error: any) {
      await tools.cmd.handleError(ctx, error, false, false);
    }
  },
};
