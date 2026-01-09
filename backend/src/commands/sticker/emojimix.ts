import { MessageContext } from '../../types/index.js';
import stickerService from '@/services/stickerService.js';
import logger from '@/utils/logger.js';

/**
 * Emoji Mix Command
 * Create mixed emoji stickers
 */

export default {
  name: 'emojimix',
  description: 'Mix two emojis to create new sticker',
  category: 'Sticker',
  usage: '!emojimix <emoji1>+<emoji2>',
  aliases: ['mixemoji'],
  cooldown: 10,

  execute: async (ctx: MessageContext) => {
    try {
      if (!ctx.args[0] || !ctx.args[0].includes('+')) {
        return ctx.reply('Usage: !emojimix 😅+🤔');
      }

      const [emoji1, emoji2] = ctx.args[0].split('+');

      if (!emoji1 || !emoji2) {
        return ctx.reply('Please provide two emojis separated by +');
      }

      // Check rate limit
      if (!stickerService.checkRateLimit(ctx.sender.jid, 'emojimix')) {
        return ctx.reply(
          'Rate limit exceeded. Please wait 10 seconds before using this command again.'
        );
      }

      await ctx.reply('⏳ Creating emoji mix...');

      // Get emoji mix results
      const result = await stickerService.emojiMix(emoji1.trim(), emoji2.trim());

      if (result.success && result.stickers.length > 0) {
        // Send each sticker
        for (const sticker of result.stickers) {
          try {
            const stickerBuffer = await stickerService.downloadMediaForSticker(sticker.url);
            const finalSticker = await stickerService.createSticker(stickerBuffer);

            await ctx.reply({ sticker: finalSticker.buffer }, {
              packname: 'WhatsDeX Bot',
              author: 'CodeDeX',
            });

            // Small delay between stickers
            await new Promise(resolve => setTimeout(resolve, 1000));
          } catch (error: any) {
            logger.error('Error sending emoji mix sticker:', error);
            continue;
          }
        }

        logger.info(`Emoji mix created for ${ctx.sender.jid}: ${emoji1}+${emoji2}`);
      } else {
        await ctx.reply('Failed to create emoji mix. Please try different emojis.');
      }
    } catch (error: any) {
      logger.error('Error in emojimix command:', error);

      if (error.message.includes('Rate limit')) {
        await ctx.reply('Rate limit exceeded. Please wait before using this command again.');
      } else if (error.message.includes('Tidak Ditemukan')) {
        await ctx.reply('Emoji mix not found. Please try different emoji combination.');
      } else {
        await ctx.reply('Terjadi kesalahan saat membuat emoji mix. Silakan coba lagi.');
      }

      logger.error('Unexpected error in emojimix:', error);
    }
  },
};
