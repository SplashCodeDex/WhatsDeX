import { MessageContext, GlobalContext } from '../../types/index.js';

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
  code: async (ctx: MessageContext) => {
    const { formatter, tools } = ctx.bot.context as GlobalContext;
    if (!tools.cmd.checkQuotedMedia(ctx.quoted?.contentType, ['viewOnce'])) {
      return await ctx.reply(
        formatter.quote(tools.msg.generateInstruction(['reply'], ['viewOnce']))
      );
    }

    try {
      const { quoted } = ctx;
      if (!quoted) throw new Error('No quoted message found');

      const quotedType = Object.keys(quoted).find(key => key.endsWith('Message'));
      if (!quotedType) throw new Error('Unknown quoted message type');

      const msg = (quoted as any)[quotedType];
      // Note: ctx.quoted.media.toBuffer() availability depends on your Baileys wrapper
      // Assuming it's available or needs a safe cast/check
      const buffer = await (ctx.quoted as any)?.media?.toBuffer();

      if (!buffer) throw new Error('Failed to download media');

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
    } catch (error: unknown) {
      await tools.cmd.handleError(ctx, error);
    }
  },
};
