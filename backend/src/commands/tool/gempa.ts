import { MessageContext } from '../../types/index.js';
import axios from 'axios';

export default {
  name: 'gempa',
  aliases: ['gempabumi', 'infogempa'],
  category: 'tool',
  permissions: {
    coin: 10,
  },
  code: async (ctx: MessageContext) => {
    const { formatter, tools, config } = ctx.bot.context;
    try {
      const apiUrl = tools.api.createUrl('https://data.bmkg.go.id', '/DataMKG/TEWS/autogempa.json');
      const result = (await axios.get(apiUrl)).data.Infogempa.gempa;

      await ctx.reply({
        image: {
          url: tools.api.createUrl('https://data.bmkg.go.id', `/DataMKG/TEWS/${result.Shakemap}`),
        },
        mimetype: tools.mime.lookup('jpeg'),
        caption:
          `${formatter.quote(`Region: ${result.Wilayah}`)}\n` +
          `${formatter.quote(`Date: ${result.Tanggal}`)}\n` +
          `${formatter.quote(`Potential: ${result.Potensi}`)}\n` +
          `${formatter.quote(`Magnitude: ${result.Magnitude}`)}\n` +
          `${formatter.quote(`Depth: ${result.Kedalaman}`)}\n` +
          `${formatter.quote(`Coordinates: ${result.Coordinates}`)}\n${formatter.quote(
            `Felt: ${result.Dirasakan}`
          )}`,
        footer: config.msg.footer,
      });
    } catch (error: any) {
      await tools.cmd.handleError(ctx, error, true);
    }
  },
};
