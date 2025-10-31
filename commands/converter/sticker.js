const { Sticker, StickerTypes } = require('wa-sticker-formatter');

module.exports = {
  name: 'sticker',
  aliases: ['s'],
  category: 'converter',
  code: async ctx => {
    const {
      formatter,
      config,
      tools: { cmd, msg },
    } = ctx.self.context;
    const [checkMedia, checkQuotedMedia] = await Promise.all([
      cmd.checkMedia(ctx.msg.contentType, ['image', 'gif', 'video']),
      cmd.checkQuotedMedia(ctx.quoted?.contentType, ['image', 'gif', 'video']),
    ]);

    if (!checkMedia && !checkQuotedMedia)
      return await ctx.reply(
        formatter.quote(msg.generateInstruction(['send', 'reply'], ['image', 'gif', 'video']))
      );

    try {
      const buffer = (await ctx.msg.media.toBuffer()) || (await ctx.quoted?.media.toBuffer());
      const sticker = new Sticker(buffer, {
        pack: config.sticker.packname,
        author: config.sticker.author,
        type: StickerTypes.FULL,
        categories: ['🌕'],
        id: ctx.id,
        quality: 50,
      });

      await ctx.reply(await sticker.toMessage());
    } catch (error) {
      await cmd.handleError(ctx, error);
    }
  },
};
