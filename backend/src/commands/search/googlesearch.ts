import { MessageContext } from '../../types/index.js';
import axios from 'axios';
import z from 'zod';
import { createUrl } from '../../tools/api.js';
import logger from '../../utils/logger.js';

export default {
  name: 'googlesearch',
  aliases: ['google', 'googles'],
  category: 'search',
  permissions: {
    coin: 10,
  },
  code: async (ctx: MessageContext) => {
    const { formatter, config } = ctx.bot.context;

    try {
      const input = ctx.args.join(' ');

      // Validation
      const querySchema = z.string().min(1, { message: 'Please provide a search query.' });
      const queryCheck = querySchema.safeParse(input);

      if (!queryCheck.success) {
        return ctx.reply(
          formatter.quote(
            `❎ ${queryCheck.error.issues[0].message}\n\nExample: .google what is whatsapp`
          )
        );
      }
      const query = queryCheck.data;

      // API Call
      const apiUrl = createUrl('neko', '/search/google', {
        q: query,
      });
      const { result } = (await axios.get(apiUrl)).data;

      if (!result || result.length === 0) {
        return ctx.reply(formatter.quote(config.msg.notFound));
      }

      const resultText = result
        .map(
          res =>
            `${formatter.quote(`Title: ${res.title}`)}\n` +
            `${formatter.quote(`Description: ${res.desc}`)}\n${formatter.quote(`URL: ${res.url}`)}`
        )
        .join(`\n${formatter.quote('· · ─ ·✶· ─ · ·')}\n`);

      return ctx.reply({
        text: resultText,
        footer: config.msg.footer,
      });
    } catch (error: any) {
      logger.error('Google search command error:', error);
      return ctx.reply(formatter.quote(`An error occurred: ${error.message}`));
    }
  },
};
