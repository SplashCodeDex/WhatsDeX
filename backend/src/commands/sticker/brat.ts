import { MessageContext } from '../../types/index.js';
import stickerService from '@/services/stickerService.js';
import logger from '@/utils/logger.js';

export default {
  name: 'brat',
  description: 'Create brat-style sticker',
  category: 'Sticker',
  usage: '!brat <text>',
  aliases: ['bratsticker'],
  cooldown: 15,

  execute: async (ctx: MessageContext) => {
    try {
      const text = ctx.args.join(' ');

      if (!text || text.length === 0) {
        return await ctx.reply('Please provide text for brat sticker');
      }

      if (text.length > 50) {
        return await ctx.reply('Text too long. Maximum 50 characters.');
      }

      await ctx.reply('⏳ Creating brat sticker...');

      const result = await stickerService.createBratSticker(text);

      if (result.success && result.data) {
        const finalSticker = await stickerService.createSticker(result.data.buffer);

        if (finalSticker.success && finalSticker.data) {
            await ctx.reply({ sticker: finalSticker.data.buffer }, {
            packname: 'WhatsDeX Bot',
            author: 'CodeDeX',
            });
            logger.info(`Brat sticker created for ${ctx.sender.jid}: "${text}"`);
        } else {
             await ctx.reply('Failed to process sticker.');
        }
      } else {
        await ctx.reply('Failed to create brat sticker. Please try again.');
      }
    } catch (error: unknown) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Error in brat command:', err);
      await ctx.reply('Terjadi kesalahan saat membuat brat sticker. Silakan coba lagi.');
    }
  },
};