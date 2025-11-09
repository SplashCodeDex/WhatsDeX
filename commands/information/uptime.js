export default {
  name: 'uptime',
  aliases: ['runtime'],
  category: 'information',
  code: async ctx => {
    const { formatter, config } = ctx.bot.context;
    await ctx.reply(formatter.quote(`🚀 Bot has been active for ${config.bot.uptime}.`));
  },
};
