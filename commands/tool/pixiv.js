import axios from 'axios';

export default {
  name: 'pixiv',
  category: 'tool',
  permissions: {
    premium: 10,
  },
  code: async ctx => {
    const { formatter, tools, config } = ctx.bot.context;
    const input = ctx.args.join(' ') || null;

    if (!input)
      return await ctx.reply(
        `${formatter.quote(tools.msg.generateInstruction(['send'], ['text']))}\n${formatter.quote(
          tools.msg.generateCmdExample(ctx.used, 'rei ayanami')
        )}`
      );

    try {
      const apiUrl = tools.api.createUrl('neko', '/search/pixiv', {
        q: input,
      });
      const result = tools.cmd.getRandomElement((await axios.get(apiUrl)).data.result).imageUrl;

      await ctx.reply({
        image: {
          url: result,
        },
        mimetype: tools.mime.lookup('jpg'),
        caption: formatter.quote(`Kueri: ${input}`),
        footer: config.msg.footer,
        buttons: [
          {
            buttonId: `${ctx.used.prefix + ctx.used.command} ${input}`,
            buttonText: {
              displayText: 'Ambil Lagi',
            },
          },
        ],
      });
    } catch (error) {
      await tools.cmd.handleError(ctx, error, true);
    }
  },
};
