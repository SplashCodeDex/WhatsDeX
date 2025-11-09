import { Baileys } from '@itsreimau/gktw';
import axios from 'axios';

/* Deprecated: gktw migrated to @whiskeysockets/baileys

*/

export default {
  name: 'removebg',
  aliases: ['rbg'],
  category: 'tool',
  permissions: {
    coin: 10,
  },
  code: async ctx => {
    const { formatter, tools, config } = ctx.bot.context;
    const [checkMedia, checkQuotedMedia] = await Promise.all([
      tools.cmd.checkMedia(ctx.msg.contentType, 'image'),
      tools.cmd.checkQuotedMedia(ctx.quoted?.contentType, 'image'),
    ]);

    if (!checkMedia && !checkQuotedMedia)
      return await ctx.reply(
        formatter.quote(tools.msg.generateInstruction(['send', 'reply'], 'image'))
      );

    try {
      const buffer = (await ctx.msg.media.toBuffer()) || (await ctx.quoted?.media.toBuffer());
      const uploadUrl = await tools.api.uploadImage(buffer);
      const apiUrl = tools.api.createUrl('izumi', '/tools/removebg', {
        imageUrl: uploadUrl,
      });
      const result = (await axios.get(apiUrl)).data.result.imageLink;

      await ctx.reply({
        image: {
          url: result,
        },
        mimetype: tools.mime.lookup('png'),
        caption: formatter.quote('Untukmu, tuan!'),
        footer: config.msg.footer,
      });
    } catch (error) {
      await tools.cmd.handleError(ctx, error, true);
    }
  },
};
