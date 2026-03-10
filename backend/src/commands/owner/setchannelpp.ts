import { MessageContext } from '../../types/index.js';
export default {
  name: 'setchannelpp',
  aliases: ['setchannelicon', 'seticonchannel', 'setppchannel'],
  category: 'owner',
  permissions: {
    owner: true,
  },
  code: async (ctx: MessageContext) => {
    const { formatter, tools } = ctx.channel.context;
    const [checkMedia, checkQuotedMedia] = await Promise.all([
      tools.cmd.checkMedia(ctx.getContentType(), 'image'),
      tools.cmd.checkQuotedMedia(ctx.quoted?.contentType, 'image'),
    ]);

    if (!checkMedia && !checkQuotedMedia)
      return await ctx.reply(
        formatter.quote(tools.msg.generateInstruction(['send', 'reply'], 'image'))
      );

    try {
      const buffer = (await ctx.getMedia()?.toBuffer?.()) || (await ctx.getQuoted()?.media?.toBuffer?.());
      await ctx.core.updateProfilePicture(ctx.core.user.id, buffer);

      await ctx.reply(formatter.quote('✅ Berhasil mengubah gambar profil channel!'));
    } catch (error: any) {
      await tools.cmd.handleError(ctx, error);
    }
  },
};
