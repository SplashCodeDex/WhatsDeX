import { MessageContext } from '../../types/index.js';
import { exec } from 'node:child_process';
import util from 'node:util';

export default {
  name: 'exec',
  aliases: ['ex'],
  code: async (ctx: MessageContext) => {
    const { formatter, tools } = ctx.bot.context;
    const isOwner = await tools.cmd.isOwner(ctx.bot.context.config, ctx.getId(ctx.sender.jid), ctx.msg.key.id, ctx.botInstanceId);
    if (!isOwner) return;

    try {
      const command = ctx.msg.content.slice(2);
      const output = await util.promisify(exec)(command);

      await ctx.reply(formatter.monospace(output.stdout || output.stderr));
    } catch (error: any) {
      await tools.cmd.handleError(ctx, error, false, false);
    }
  },
};
