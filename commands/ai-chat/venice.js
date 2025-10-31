const axios = require('axios');
const { createUrl } = require('../../tools/api');

module.exports = {
  name: 'venice',
  aliases: ['veniceai'],
  category: 'ai-chat',
  permissions: {
    coin: 10,
  },
  code: async ctx => {
    const { formatter } = ctx.bot.context;
    const input = ctx.args.join(' ') || ctx.quoted?.content || null;

    if (!input) {
      return ctx.reply(formatter.quote('Please provide an input text.'));
    }

    try {
      const apiUrl = createUrl('hang', '/ai/venicechat', {
        text: input,
      });
      const response = await axios.get(apiUrl);
      const { result } = response.data;

      return ctx.reply(result);
    } catch (error) {
      console.error(error);
      return ctx.reply(formatter.quote(`An error occurred: ${error.message}`));
    }
  },
};
