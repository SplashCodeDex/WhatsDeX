export default {
  name: 'botgroup',
  aliases: ['botgc', 'gcbot'],
  category: 'information',
  code: async ctx => {
    const { formatter, config } = ctx.bot.context;
    await ctx.reply(formatter.quote(config.bot.groupLink));
  },
};
