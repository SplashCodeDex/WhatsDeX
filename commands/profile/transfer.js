const z = require('zod');
const { db } = require('../../src/utils');

module.exports = {
  name: 'transfer',
  aliases: ['tf'],
  category: 'profile',
  code: async ctx => {
    const { formatter } = ctx.bot.context;

    try {
      // Argument parsing
      const userJid =
        ctx.quoted?.senderJid ||
        (await ctx.getMentioned())[0] ||
        (ctx.args[0] ? `${ctx.args[0].replace(/[^\d]/g, '')}${`@s.whatsapp.net`}` : null);
      const amountStr = ctx.quoted?.senderJid ? ctx.args[0] : ctx.args[1];

      // Validation
      if (!userJid || !amountStr) {
        return ctx.reply(
          formatter.quote(
            'Please specify a user and an amount to transfer.\n\nExample: .transfer @user 100'
          )
        );
      }

      const amountSchema = z.coerce
        .number({ invalid_type_error: 'The amount must be a number.' })
        .int()
        .positive('The amount must be a positive whole number.');
      const validationResult = amountSchema.safeParse(amountStr);

      if (!validationResult.success) {
        return ctx.reply(
          formatter.quote(`❎ Invalid amount: ${validationResult.error.issues[0].message}`)
        );
      }
      const coinAmount = validationResult.data;

      // Business logic
      const senderJid = ctx.sender.jid;
      const senderId = ctx.getId(senderJid);

      const isOnWhatsApp = await ctx.core.onWhatsApp(userJid);
      if (isOnWhatsApp.length === 0)
        return ctx.reply(formatter.quote('❎ User not found on WhatsApp!'));

      const userDb = (await db.get(`user.${senderId}`)) || {};

      if (ctx.isOwner || userDb?.premium)
        return ctx.reply(formatter.quote('❎ Unlimited coins cannot be transferred.'));
      if (userDb?.coin < coinAmount)
        return ctx.reply(formatter.quote('❎ You do not have enough coins for this transfer!'));

      // Database transaction
      await db.add(`user.${ctx.getId(userJid)}.coin`, coinAmount);
      await db.subtract(`user.${senderId}.coin`, coinAmount);

      return ctx.reply(formatter.quote(`✅ Successfully transferred ${coinAmount} coins!`));
    } catch (error) {
      console.error(error);
      return ctx.reply(formatter.quote(`An error occurred: ${error.message}`));
    }
  },
};
