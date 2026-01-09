import { MessageContext } from '../../types/index.js';
import axios from 'axios';

export default {
  name: 'spotifysearch',
  aliases: ['spotify', 'spotifys'],
  category: 'search',
  permissions: {
    coin: 10,
  },
  code: async (ctx: MessageContext) => {
    const { formatter, tools, config } = ctx.bot.context;
    const input = ctx.args.join(' ') || null;

    if (!input)
      return await ctx.reply(
        `${formatter.quote(tools.msg.generateInstruction(['send'], ['text']))}\n${formatter.quote(
          tools.msg.generateCmdExample(ctx.used, 'one last kiss - hikaru utada')
        )}`
      );

    try {
      const apiUrl = tools.api.createUrl('diibot', '/api/search/spotify', {
        query: input,
      });
      const { result } = (await axios.get(apiUrl)).data;

      const resultText = result
        .map(
          res =>
            `${formatter.quote(`Judul: ${res.trackName}`)}\n` +
            `${formatter.quote(`Artis: ${res.artistName}`)}\n${formatter.quote(
              `URL: ${res.externalUrl}`
            )}`
        )
        .join('\n' + `${formatter.quote('· · ─ ·✶· ─ · ·')}\n`);
      await ctx.reply({
        text: resultText || config.msg.notFound,
        footer: config.msg.footer,
      });
    } catch (error: any) {
      await tools.cmd.handleError(ctx, error, true);
    }
  },
};
