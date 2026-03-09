import { MessageContext } from '../../types/index.js';

export default {
    name: 'banuser',
    aliases: ['ban', 'bu'],
    category: 'owner',
    description: 'Ban a user from using the bot (Owner only).',
    permissions: {
        owner: true,
    },
    code: async (ctx: MessageContext) => {
        const { formatter, tools, database: db } = ctx.channel.context;
        const userJid =
            ctx.quoted?.senderJid ||
            (ctx.getMentioned ? (await ctx.getMentioned())[0] : null) ||
            (ctx.args[0] ? `${ctx.args[0].replace(/[^\d]/g, '')}@s.whatsapp.net` : null);

        if (!userJid)
            return await ctx.reply({
                text:
                    `${formatter.quote(tools.msg.generateInstruction(['send'], ['text']))}\n` +
                    `${formatter.quote(tools.msg.generateCmdExample(ctx.used, `@${ctx.getId(ctx.sender.jid)}`))}\n` +
                    `${formatter.quote(tools.msg.generateNotes(['Reply to or quote a message to target the sender.']))}\n${formatter.quote(
                        tools.msg.generatesFlagInfo({
                            '-s': 'Silent mode: do not notify the user about the ban.',
                        })
                    )}`,
                mentions: [ctx.sender.jid],
            });

        const isOnWhatsApp = ctx.channel.onWhatsApp ? await ctx.channel.onWhatsApp(userJid) : [];
        if (!isOnWhatsApp || isOnWhatsApp.length === 0)
            return await ctx.reply(formatter.quote('❎ Account does not exist on WhatsApp!'));

        try {
            await db.set(`user.${ctx.getId(userJid)}.banned`, true);

            const flag = tools.cmd.parseFlag(ctx.args.join(' '), {
                '-s': {
                    type: 'boolean',
                    key: 'silent',
                },
            });

            const silent = flag?.silent || false;
            if (!silent)
                await ctx.sendMessage(userJid, {
                    text: formatter.quote('📢 You have been banned by the Owner!'),
                });

            await ctx.reply(formatter.quote('✅ Successfully banned the user!'));
        } catch (error: any) {
            await tools.cmd.handleError(ctx, error);
        }
    },
};
