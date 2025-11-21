import axios from 'axios';

export default {
  name: 'joke',
  aliases: ['jokes'],
  category: 'entertainment',
  permissions: {
    coin: 10,
  },
  code: async ctx => {
    const { tools, config } = ctx.bot.context;
    try {
      const apiUrl = tools.api.createUrl('https://candaan-api.vercel.app', '/api/text/random');
      const result = (await axios.get(apiUrl)).data.data;

      await ctx.reply({
        text: result,
        footer: config.msg.footer,
        buttons: [
          {
            buttonId: ctx.used.prefix + ctx.used.command,
            buttonText: {
              displayText: 'Ambil Lagi',
            },
          },
        ],
      });
    } catch (error) {
      await tools.cmd.handleError(ctx, error, true);
    }
  },
};
