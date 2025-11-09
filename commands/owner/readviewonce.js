const MessageType = {
  audioMessage: 'audioMessage',
  imageMessage: 'imageMessage',
  videoMessage: 'videoMessage',
};

export default {
  name: 'readviewonce',
  aliases: ['rvo'],
  category: 'owner',
  permissions: {
    owner: true,
  },
  code: async ctx => {
    const { formatter, tools } = ctx.bot.context;
    if (!tools.cmd.checkQuotedMedia(ctx.quoted?.contentType, ['viewOnce']))
      return await ctx.reply(
        formatter.quote(tools.msg.generateInstruction(['reply'], ['viewOnce']))
      );

    try {
      const { quoted } = ctx;
      const quotedType = Object.keys(quoted).find(key => key.endsWith('Message'));
      const msg = quoted[quotedType];
      const buffer = await ctx.quoted?.media.toBuffer();

      const options = {
        mimetype: msg.mimetype,
        caption: msg.caption || '',
      };

      if (quotedType === MessageType.audioMessage) {
        await ctx.reply({
          audio: buffer,
          mimetype: msg.mimetype,
          ptt: true,
        });
      } else if (quotedType === MessageType.imageMessage) {
        await ctx.reply({
          image: buffer,
          ...options,
        });
      } else if (quotedType === MessageType.videoMessage) {
        await ctx.reply({
          video: buffer,
          ...options,
        });
      }
    } catch (error) {
      await tools.cmd.handleError(ctx, error);
    }
  },
};
