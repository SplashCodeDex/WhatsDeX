module.exports = {
  name: 'cosplay',
  aliases: ['cosplayer'],
  category: 'entertainment',
  permissions: {
    premium: true,
  },
  code: async ctx => {
    const { formatter, tools, config } = ctx.bot.context;
    try {
      const result = tools.api.createUrl('neko', '/random/cosplay');

      await ctx.reply({
        image: {
          url: result,
        },
        mimetype: tools.mime.lookup('png'),
        caption: formatter.quote('Untukmu, tuan!'),
        footer: config.msg.footer,
        buttons: [
          {
            buttonId: ctx.used.prefix + ctx.used.command,
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
