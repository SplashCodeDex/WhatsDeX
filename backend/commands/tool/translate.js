import axios from 'axios';
import z from 'zod';
import { createUrl } from '../../tools/api.js';

export default {
  name: 'translate',
  aliases: ['tr'],
  category: 'tool',
  permissions: {
    coin: 10,
  },
  code: async ctx => {
    const { formatter, config } = ctx.bot.context;

    try {
      const langCode = ctx.args[0]?.length === 2 ? ctx.args[0] : 'id';
      const input =
        ctx.args.slice(ctx.args[0]?.length === 2 ? 1 : 0).join(' ') || ctx.quoted?.content || '';

      if (input.toLowerCase() === 'list') {
        const langListUrl = createUrl(
          'https://raw.githubusercontent.com',
          '/itsecurityco/to-google-translate/refs/heads/master/supported_languages.json'
        );
        const response = await axios.get(langListUrl);
        const listText = response.data
          .map(
            lang =>
              `${formatter.quote(`Language Code: ${lang.code}`)}\n${formatter.quote(`Language: ${lang.language}`)}`
          )
          .join(`\n${formatter.quote('· · ─ ·✶· ─ · ·')}\n`);
        return ctx.reply({ text: listText, footer: config.msg.footer });
      }

      // Validation
      const inputSchema = z.string().min(1, { message: 'Please provide text to translate.' });
      const inputCheck = inputSchema.safeParse(input);
      if (!inputCheck.success) {
        return ctx.reply(
          formatter.quote(`❎ ${inputCheck.error.issues[0].message}\n\nExample: .tr en hello world`)
        );
      }
      const textToTranslate = inputCheck.data;

      // API Call
      const apiUrl = createUrl('davidcyril', '/tools/translate', {
        text: textToTranslate,
        to: langCode,
      });
      const result = (await axios.get(apiUrl)).data.translated_text;

      return ctx.reply(result);
    } catch (error) {
      console.error(error);
      return ctx.reply(formatter.quote(`An error occurred: ${error.message}`));
    }
  },
};
