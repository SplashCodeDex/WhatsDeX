import { MessageContext } from '../../types/index.js';
export default {
  name: 'donate',
  aliases: ['donasi', 'support'],
  category: 'information',
  code: async (ctx: MessageContext) => {
    const { formatter, tools, config, database: db } = ctx.bot.context;
    try {
      const qrisLink = (await db.get('bot.text.qris')) || null;
      const customText = (await db.get('bot.text.donate')) || null;
      const text = customText
        ? customText
            .replace(/%tag%/g, `@${ctx.getId(ctx.sender.jid)}`)
            .replace(/%name%/g, config.bot.name)
            .replace(/%prefix%/g, ctx.used.prefix)
            .replace(/%command%/g, ctx.used.command)
            .replace(/%footer%/g, config.msg.footer)
            .replace(/%readmore%/g, config.msg.readmore)
        : `${formatter.quote('YOUR_DANA_NUMBER (DANA)')}\n${formatter.quote(
            'YOUR_PULSA_KUOTA_NUMBER (Pulsa & Kuota)'
          )}\n${formatter.quote('· · ─ ·✶· ─ · ·')}\n${formatter.quote(
            'YOUR_PAYPAL_LINK (PayPal)'
          )}\n${formatter.quote('YOUR_SAWERIA_LINK (Saweria)')}\n${formatter.quote(
            'YOUR_TAKO_LINK (Tako)'
          )}\n${formatter.quote('YOUR_TRAKTEER_LINK (Trakteer)')}`;

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
    } catch (error: any) {
      await tools.cmd.handleError(config, ctx, error);
    }
  },
};
