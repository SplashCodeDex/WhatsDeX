import axios from 'axios';

export default {
  name: 'ppcouple',
  aliases: ['ppcp'],
  category: 'entertainment',
  permissions: {
    coin: 10,
  },
  code: async ctx => {
    const { tools } = ctx.bot.context;
    try {
      const apiUrl = tools.api.createUrl('https://sandipbaruwal.onrender.com', '/dp');
      const result = (await axios.get(apiUrl)).data;

      await ctx.reply({
        album: [
          {
            image: {
              url: result.male,
            },
            mimetype: tools.mime.lookup('jpg'),
          },
          {
            image: {
              url: result.female,
            },
            mimetype: tools.mime.lookup('jpg'),
          },
        ],
      });
    } catch (error) {
      await tools.cmd.handleError(ctx, error, true);
    }
  },
};
