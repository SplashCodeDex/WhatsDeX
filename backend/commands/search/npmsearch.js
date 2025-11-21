import axios from 'axios';

export default {
  name: 'npmsearch',
  aliases: ['npm', 'npms'],
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
          tools.msg.generateCmdExample(ctx.used, 'baileys')
        )}`
      );

    try {
      const apiUrl = tools.api.createUrl('hang', '/search/npm', {
        q: input,
      });
      const { result } = (await axios.get(apiUrl)).data;

      const resultText = result
        .map(
          res =>
            `${formatter.quote(`Name: ${res.title}`)}\n` +
            `${formatter.quote(`Developer: ${res.author}`)}\n${formatter.quote(
              `URL: ${res.links.npm}`
            )}`
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
