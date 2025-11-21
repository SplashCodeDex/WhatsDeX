import { exec } from 'node:child_process';
import util from 'node:util';

export default {
  name: /^\$ /,
  type: 'hears',
  code: async ctx => {
    const { formatter, tools } = ctx.bot.context;
    const isOwner = await tools.cmd.isOwner(ctx.bot.context.config, ctx.getId(ctx.sender.jid), ctx.msg.key.id, ctx.botInstanceId);
    if (!isOwner) return;

    try {
      const command = ctx.msg.content.slice(2);
      const output = await util.promisify(exec)(command);

      await ctx.reply(formatter.monospace(output.stdout || output.stderr));
    } catch (error) {
      await tools.cmd.handleError(ctx, error, false, false);
    }
  },
};
