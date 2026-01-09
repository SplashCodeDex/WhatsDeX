import { MessageContext } from '../../types/index.js';
import stickerService from '@/services/stickerService.js';
import logger from '@/utils/logger.js';

/**
 * Brat Sticker Command
 * Create brat-style text stickers
 */

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
        return ctx.reply('Please provide text for brat sticker');
      }

      if (text.length > 50) {
        return ctx.reply('Text too long. Maximum 50 characters.');
      }

      // Check rate limit
      if (!stickerService.checkRateLimit(ctx.sender.jid, 'brat')) {
        return ctx.reply(
          'Rate limit exceeded. Please wait 15 seconds before using this command again.'
        );
      }

      await ctx.reply('⏳ Creating brat sticker...');

      // Create brat sticker
      const result = await stickerService.createBratSticker(text);

      if (result.success) {
        // Create final sticker
        const finalSticker = await stickerService.createSticker(result.buffer);

        await ctx.reply({ sticker: finalSticker.buffer }, {
          packname: 'WhatsDeX Bot',
          author: 'CodeDeX',
        });

        logger.info(`Brat sticker created for ${ctx.sender.jid}: "${text}"`);
      } else {
        await ctx.reply('Failed to create brat sticker. Please try again.');
      }
    } catch (error: any) {
      logger.error('Error in brat command:', error);

      if (error.message.includes('Rate limit')) {
        await ctx.reply('Rate limit exceeded. Please wait before using this command again.');
      } else if (error.message.includes('Text too long')) {
        await ctx.reply('Text too long. Please use shorter text (max 50 characters).');
      } else {
        await ctx.reply('Terjadi kesalahan saat membuat brat sticker. Silakan coba lagi.');
      }

      logger.error('Unexpected error in brat:', error);
    }
  },
};
