import { MessageContext } from '../../types/index.js';

export default {
    name: 'mode',
    aliases: ['m'],
    category: 'owner',
    description: 'Change the bot\'s operating mode.',
    permissions: {
        owner: true,
    },
    code: async (ctx: MessageContext) => {
        const { formatter, tools, config, database: db } = ctx.bot.context;
        const input = ctx.args.join(' ') || null;

        if (!input)
            return await ctx.reply(
                `${formatter.quote(tools.msg.generateInstruction(['send'], ['text']))}\n` +
                `${formatter.quote(tools.msg.generateCmdExample(ctx.used, 'self'))}\n${formatter.quote(
                    tools.msg.generateNotes([
                        `Type ${formatter.inlineCode(`${ctx.used.prefix + ctx.used.command} list`)} to see the list.`,
                    ])
                )}`
            );

        if (input.toLowerCase() === 'list') {
            const listText = await tools.list.get('mode');
            return await ctx.reply({
                text: listText,
                footer: config.msg.footer,
            });
        }

        try {
            switch (input.toLowerCase()) {
                case 'group':
                case 'private':
                case 'public':
                case 'self':
                    await db.set('bot.mode', input.toLowerCase());
                    break;
                default:
                    return await ctx.reply(formatter.quote(`❎ Mode "${input}" is invalid!`));
            }

            await ctx.reply(formatter.quote(`✅ Successfully changed mode to ${input}!`));
        } catch (error: any) {
            await tools.cmd.handleError(ctx, error);
        }
    },
};