import { MessageContext } from '../../types/index.js';

export default {
    name: 'donate',
    aliases: ['donasi', 'support'],
    category: 'information',
    description: 'Support the bot developer through donations.',
    code: async (ctx: MessageContext) => {
        const { formatter, tools, config, database: db } = ctx.bot.context;
        try {
            const qrisLink = (await db.get<string>('bot.text.qris')) || null;
            const customText = (await db.get<string>('bot.text.donate')) || null;
            const text = customText
                ? customText
                    .replace(/%tag%/g, `@${ctx.getId(ctx.sender.jid)}`)
                    .replace(/%name%/g, config.bot.name)
                    .replace(/%prefix%/g, ctx.used.prefix)
                    .replace(/%command%/g, ctx.used.command)
                    .replace(/%footer%/g, config.msg.footer)
                    .replace(/%readmore%/g, config.msg.readmore)
                : `${formatter.quote('DANA: YOUR_DANA_NUMBER')}\n${formatter.quote(
                    'Pulsa: YOUR_PULSA_NUMBER'
                )}\n${formatter.quote('· · ─ ·✶· ─ · ·')}\n${formatter.quote(
                    'PayPal: YOUR_PAYPAL_LINK'
                )}\n${formatter.quote('Saweria: YOUR_SAWERIA_LINK')}\n${formatter.quote(
                    'Trakteer: YOUR_TRAKTEER_LINK'
                )}`;

            if (qrisLink) {
                await ctx.reply({
                    image: {
                        url: qrisLink,
                    },
                    mimetype: tools.mime.lookup('jpg'),
                    caption: text,
                    mentions: [ctx.sender.jid],
                    footer: config.msg.footer,
                });
            } else {
                await ctx.reply({
                    text,
                    mentions: [ctx.sender.jid],
                    footer: config.msg.footer,
                });
            }
        } catch (error: unknown) {
            await tools.cmd.handleError(ctx, error);
        }
    },
};