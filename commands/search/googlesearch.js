const axios = require('axios');
const z = require('zod');
const { createUrl } = require('../../tools/api');

module.exports = {
  name: 'googlesearch',
  aliases: ['google', 'googles'],
  category: 'search',
  permissions: {
    coin: 10,
  },
  code: async (ctx) => {
    const { formatter, config } = ctx.bot.context;

    try {
      const input = ctx.args.join(' ');

      // Validation
      const querySchema = z.string().min(1, { message: 'Please provide a search query.' });
      const queryCheck = querySchema.safeParse(input);

      if (!queryCheck.success) {
        return ctx.reply(formatter.quote(`❎ ${queryCheck.error.issues[0].message}\n\nExample: .google what is whatsapp`));
      }
      const query = queryCheck.data;

      // API Call
      const apiUrl = createUrl('neko', '/search/google', {
        q: query,
      });
      const result = (await axios.get(apiUrl)).data.result;

      if (!result || result.length === 0) {
        return ctx.reply(formatter.quote(config.msg.notFound));
      }

      const resultText = result.map((res) => `${formatter.quote(`Judul: ${res.title}`)}\n`
                    + `${formatter.quote(`Deskripsi: ${res.desc}`)}\n`
                    + formatter.quote(`URL: ${res.url}`)).join(`\n${formatter.quote('· · ─ ·✶· ─ · ·')}\n`);

      return ctx.reply({
        text: resultText,
        footer: config.msg.footer,
      });
    } catch (error) {
      console.error(error);
      return ctx.reply(formatter.quote(`An error occurred: ${error.message}`));
    }
  },
};