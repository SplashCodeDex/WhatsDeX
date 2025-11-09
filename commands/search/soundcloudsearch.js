import axios from 'axios';

export default {
  name: 'soundcloudsearch',
  aliases: ['soundcloud', 'soundclouds'],
  category: 'search',
  permissions: {
    coin: 10,
  },
  code: async ctx => {
    const { formatter, tools, config } = ctx.bot.context;
    const input = ctx.args.join(' ') || null;

    if (!input)
      return await ctx.reply(
        `${formatter.quote(tools.msg.generateInstruction(['send'], ['text']))}\n${formatter.quote(
          tools.msg.generateCmdExample(ctx.used, 'one last kiss - hikaru utada')
        )}`
      );

    try {
      const apiUrl = tools.api.createUrl('izumi', '/search/soundcloud', {
        query: input,
      });
      const { result } = (await axios.get(apiUrl)).data;

      const resultText = result
        .map(
          res => `${formatter.quote(`Judul: ${res.title}`)}\n${formatter.quote(`URL: ${res.url}`)}`
        )
        .join('\n' + `${formatter.quote('· · ─ ·✶· ─ · ·')}\n`);
      await ctx.reply({
        text: resultText || config.msg.notFound,
        footer: config.msg.footer,
      });
    } catch (error) {
      await tools.cmd.handleError(ctx, error, true);
    }
  },
};
