import { MessageContext, GlobalContext } from '../../types/index.js';
import { exec } from 'node:child_process';
import util from 'node:util';

export default {
  name: 'exec',
  aliases: ['ex'],
  category: 'owner',
  permissions: {
    owner: true,
  },
  code: async (ctx: MessageContext) => {
    const { formatter, tools, config } = ctx.bot.context as GlobalContext;
    const isOwner = await tools.cmd.isOwner(config, ctx.getId(ctx.sender.jid), ctx.msg.key?.id, (ctx as any).botInstanceId);
    if (!isOwner) return;

    try {
      const content = ctx.msg.content || '';
      const command = content.slice(2);

      const { stdout, stderr } = await util.promisify(exec)(command);

      await ctx.reply(formatter.monospace(stdout || stderr));
    } catch (error: unknown) {
      await tools.cmd.handleError(ctx, error, false, false);
    }
  },
};
