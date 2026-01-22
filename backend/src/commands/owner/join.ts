import { MessageContext, GlobalContext } from '../../types/index.js';
import { URL } from 'node:url';

export default {
    name: 'join',
    aliases: ['j'],
    category: 'owner',
    description: 'Make the bot join a group via invite link (Owner only).',
    permissions: {
        owner: true,
    },
    code: async (ctx: MessageContext) => {
        const { formatter, tools, config, tenantConfigService } = ctx.bot.context as GlobalContext;
        const tenantId = (ctx.bot as any).tenantId;

        const url = ctx.args[0] || null;

        if (!url) {
            const instruction = tools.msg.generateInstruction(['send'], ['text']);
            const groupLink = config.bot.groupLink || 'https://chat.whatsapp.com/CodeDeX';
            const example = tools.msg.generateCmdExample(ctx.used, groupLink);
            return await ctx.reply(`${formatter.quote(instruction)}
${formatter.quote(example)}`);
        }

        const isUrl = tools.cmd.isUrl(url);
        if (!isUrl) return await ctx.reply(config.msg.urlInvalid || 'Invalid URL');

        try {
            const tenantResult = await tenantConfigService.getTenantSettings(tenantId);
            const ownerName = tenantResult.success ? tenantResult.data.ownerName || 'Unknown' : 'Unknown';

            const urlCode = new URL(url).pathname.split('/').pop();
            if (!urlCode) throw new Error('Invalid invite link');

            const res = await (ctx.bot as any).groupAcceptInvite(urlCode);

            if (res) {
                await ctx.sendMessage(res, {
                    text: formatter.quote(
                        `👋 Hello! I am a WhatsApp bot named ${config.bot.name}, owned by ${ownerName}. I can perform many commands, such as creating stickers, using AI for specific tasks, and other useful commands. I am here to entertain and please you!`
                    ),
                });
            }

            await ctx.reply(formatter.quote('✅ Successfully joined the group!'));
        } catch (error: unknown) {
            await tools.cmd.handleError(ctx, error);
        }
    },
};