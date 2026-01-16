import { MessageContext, GlobalContext } from '../../types/index.js';
import util from 'node:util';

export default {
  name: 'eval',
  aliases: ['ev'],
  category: 'owner',
  permissions: {
    owner: true,
  },
  code: async (ctx: MessageContext) => {
    const { formatter, config, tools, tenantConfigService } = ctx.bot.context as GlobalContext;
    const tenantId = (ctx.bot as any).tenantId;

    let ownerNumber = 'system';
    try {
      const tenantResult = await tenantConfigService.getTenantSettings(tenantId);
      if (tenantResult.success && tenantResult.data.ownerNumber) {
        ownerNumber = tenantResult.data.ownerNumber;
      }
    } catch (err) { }

    const isOwner = await tools.cmd.isOwner([ownerNumber], ctx.getId(ctx.sender.jid), ctx.msg.key?.id, (ctx as any).botInstanceId);
    if (!isOwner) return;

    try {
      const content = ctx.msg.content || '';
      const isAsync = content.startsWith('==> ');
      const code = content.slice(isAsync ? 4 : 3);

      const result = await eval(
        isAsync ? `(async () => { ${code} })()` : code
      );

      await ctx.reply(formatter.monospace(util.inspect(result)));
    } catch (error: unknown) {
      await tools.cmd.handleError(ctx, error, false, false);
    }
  },
};
