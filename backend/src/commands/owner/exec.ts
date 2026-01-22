import { MessageContext, GlobalContext } from '../../types/index.js';
import { exec } from 'node:child_process';
import util from 'node:util';

export default {
    name: 'exec',
    aliases: ['ex'],
    category: 'owner',
    description: 'Execute shell commands (Owner only).',
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
            const command = content.slice(2);

            const { stdout, stderr } = await util.promisify(exec)(command);

            await ctx.reply(formatter.monospace(stdout || stderr));
        } catch (error: unknown) {
            await tools.cmd.handleError(ctx, error, false, false);
        }
    },
};