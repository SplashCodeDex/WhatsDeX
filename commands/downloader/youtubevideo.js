const axios = require('axios');
const z = require('zod');
const { lookup } = require('mime-types');
const { createUrl } = require('../../tools/api');
const { parseFlag } = require('../../tools/cmd');

module.exports = {
  name: 'youtubevideo',
  aliases: ['ytmp4', 'ytv', 'ytvideo'],
  category: 'downloader',
  permissions: {
    coin: 10,
  },
  code: async (ctx) => {
    const { formatter, config } = ctx.bot.context;

    try {
      const flag = parseFlag(ctx.args.join(' ') || null, {
        '-d': { type: 'boolean', key: 'document' },
        '-q': {
          type: 'value',
          key: 'quality',
          validator: (val) => !Number.isNaN(val) && parseInt(val, 10) > 0,
          parser: (val) => parseInt(val, 10),
        },
      });

      // --- Validation ---
      const urlSchema = z.string()
        .url({ message: 'Please provide a valid URL.' })
        .refine((val) => !val.includes(' '), { message: 'The URL cannot contain spaces.' });
      const urlCheck = urlSchema.safeParse(flag.input || '');
      if (!urlCheck.success) {
        return ctx.reply(formatter.quote(`❎ ${urlCheck.error.issues[0].message}\n\nExample: .ytv https://youtu.be/example -q 720`));
      }
      const url = urlCheck.data;

      const qualitySchema = z.enum(['144', '240', '360', '480', '720', '1080']).default('720');
      const quality = qualitySchema.parse(flag.quality?.toString());
      // --- End Validation ---

      const apiUrl = createUrl('izumi', '/downloader/youtube', {
        url,
        format: quality,
      });
      const result = (await axios.get(apiUrl)).data.result;

      const asDocument = flag?.document || false;
      if (asDocument) {
        await ctx.reply({
          document: { url: result.download },
          fileName: `${result.title}.mp4`,
          mimetype: lookup('mp4'),
          caption: formatter.quote(`URL: ${url}`),
          footer: config.msg.footer,
        });
      } else {
        await ctx.reply({
          video: { url: result.download },
          mimetype: lookup('mp4'),
          caption: formatter.quote(`URL: ${url}`),
          footer: config.msg.footer,
        });
      }
    } catch (error) {
      console.error(error);
      await ctx.reply(formatter.quote(`An error occurred: ${error.message}`));
    }
  },
};