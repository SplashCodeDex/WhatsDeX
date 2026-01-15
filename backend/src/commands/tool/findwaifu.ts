import { MessageContext } from '../../types/index.js';
import axios from 'axios';

/* Note: Removed deprecated @itsreimau/gktw import (migrated to baileys)
   The Baileys import was unused in this command.
*/

export default {
  name: 'findwaifu',
  category: 'tool',
  permissions: {
    coin: 10,
  },
  code: async (ctx: MessageContext) => {
    const { formatter, tools } = ctx.bot.context;
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
      const apiUrl = tools.api.createUrl('neko', '/tools/find-waifu', {
        imageUrl: uploadUrl,
      });
      const result = (await axios.get(apiUrl)).data.result.character.name;

      await ctx.reply(tools.msg.ucwords(result));
    } catch (error: any) {
      await tools.cmd.handleError(ctx, error, true);
    }
  },
};
