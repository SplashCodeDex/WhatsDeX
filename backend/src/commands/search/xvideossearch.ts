import { MessageContext } from '../../types/index.js';
import axios from 'axios';

export default {
  name: 'xvideossearch',
  aliases: ['xvideos', 'xvideoss'],
  category: 'search',
  permissions: {
    premium: true,
  },
  code: async (ctx: MessageContext) => {
    const { formatter, tools, config } = ctx.bot.context;
    const input = ctx.args.join(' ') || null;

    if (!input)
      return await ctx.reply(
        `${formatter.quote(tools.msg.generateInstruction(['send'], ['text']))}\n${formatter.quote(
          tools.msg.generateCmdExample(ctx.used, 'evangelion')
        )}`
      );

    try {
      const apiUrl = tools.api.createUrl('neko', '/search/xvideos', {
        q: input,
      });
      const { result } = (await axios.get(apiUrl)).data;

      const resultText = result
        .map(
          res =>
            `${formatter.quote(`Judul: ${res.title}`)}\n` +
            `${formatter.quote(`Pembuat: ${res.artist}`)}\n` +
            `${formatter.quote(`Durasi: ${res.duration}`)}\n${formatter.quote(`URL: ${res.url}`)}`
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
