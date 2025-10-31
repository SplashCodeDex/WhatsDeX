const axios = require('axios');

module.exports = {
  name: 'githubdl',
  aliases: ['ghdl', 'gitclone'],
  category: 'downloader',
  permissions: {
    coin: 10,
  },
  code: async ctx => {
    const { formatter, tools, config } = ctx.bot.context;
    const url = ctx.args[0] || null;

    if (!url)
      return await ctx.reply(
        `${formatter.quote(tools.msg.generateInstruction(['send'], ['text']))}\n${formatter.quote(
          tools.msg.generateCmdExample(ctx.used, 'https://github.com/itsreimau/whatsdex')
        )}`
      );

    const isUrl = tools.cmd.isUrl(url);
    if (!isUrl) return await ctx.reply(config.msg.urlInvalid);

    try {
      const apiUrl = tools.api.createUrl('diibot', '/api/download/gitclone', {
        url,
      });
      const { result } = (await axios.get(apiUrl)).data;

      await ctx.reply({
        document: {
          url: result.urllink,
        },
        fileName: result.filename,
        mimetype: tools.mime.lookup(result.filename) || 'application/octet-stream',
        caption: formatter.quote(`URL: ${url}`),
        footer: config.msg.footer,
      });
    } catch (error) {
      await tools.cmd.handleError(ctx, error, true);
    }
  },
};
