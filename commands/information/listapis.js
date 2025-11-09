export default {
  name: 'listapis',
  aliases: ['listapi'],
  category: 'information',
  code: async ctx => {
    const { formatter, tools, config } = ctx.bot.context;
    try {
      const APIs = tools.api.listUrl();
      let resultText = '';

      for (const [name, api] of Object.entries(APIs))
        resultText += formatter.quote(`${api.baseURL}\n`);

      await ctx.reply({
        text: `${formatter.quote('List of APIs used:')}\n${resultText.trim()}`,
        footer: config.msg.footer,
      });
    } catch (error) {
      await tools.cmd.handleError(ctx, error);
    }
  },
};
