module.exports = {
  name: 'tqto',
  aliases: ['thanksto'],
  category: 'information',
  code: async ctx => {
    const { formatter, config } = ctx.bot.context;
    await ctx.reply({
      text:
        `${formatter.quote('CodeDeX (https://github.com/SplashCodeDex)')}\n` +
        `${formatter.quote('Jastin Linggar Tama (https://github.com/JastinXyz)')}\n` +
        `${formatter.quote('RexxHayanasi (https://github.com/RexxHayanasi)')}\n` +
        `${formatter.quote('Rippanteq7 (https://github.com/Rippanteq7)')}\n` +
        `${formatter.quote('Rizky Pratama (https://github.com/Kyluxx)')}\n` +
        `${formatter.quote('FandyAhmD (https://github.com/fandyahmd)')}\n${formatter.quote(
          'And to all parties who have helped in the development of this bot. (Many if typed one by one)'
        )}`,
      footer: config.msg.footer,
    }); // Jika kamu tidak menghapus ini, terima kasih!
  },
};
