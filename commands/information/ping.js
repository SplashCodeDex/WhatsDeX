const { convertMsToDuration } = require('../../utils/formatters');

module.exports = {
  name: 'ping',
  category: 'information',
  code: async (ctx) => {
    const { formatter } = ctx.bot.context;
    try {
      const startTime = performance.now();
      const pongMsg = await ctx.reply(formatter.quote('🏓 Pong!'));
      const responseTime = performance.now() - startTime;
      await ctx.editMessage(pongMsg.key, formatter.quote(`🏓 Pong! Merespon dalam ${convertMsToDuration(responseTime)}.`));
    } catch (error) {
      console.error(error);
      await ctx.reply(formatter.quote(`An error occurred: ${error.message}`));
    }
  },
};
