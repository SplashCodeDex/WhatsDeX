export default {
  name: 'sc',
  aliases: ['script', 'source', 'sourcecode'],
  category: 'information',
  code: async ctx => {
    const { formatter, config } = ctx.bot.context;
    await ctx.reply({
      text: formatter.quote('https://github.com/SplashCodeDex/WhatsDeX'),
      footer: config.msg.footer,
    }); // If you don't delete this, thank you!
  },
};
