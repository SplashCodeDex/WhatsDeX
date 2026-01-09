import { MessageContext } from '../../types/index.js';
import axios from 'axios';

export default {
  name: 'githubsearch',
  aliases: ['github', 'githubs'],
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
          tools.msg.generateCmdExample(ctx.used, 'whatsdex')
        )}`
      );

    try {
      const apiUrl = tools.api.createUrl('neko', '/search/github-search', {
        q: input,
      });
      const { result } = (await axios.get(apiUrl)).data;

      const resultText = result
        .map(
          res =>
            `${formatter.quote(`Name: ${res.full_name}`)}
` +
            `${formatter.quote(`Description: ${res.description}`)}
` +
            `${formatter.quote(`Count: ${res.stars} stars, ${res.forks} forks`)}
` +
            `${formatter.quote(`Language: ${res.language}`)}
${formatter.quote(`URL: ${res.url}`)}`
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
