import { MessageContext } from '../../types/index.js';
import stickerService from '@/services/stickerService.js';
import logger from '@/utils/logger.js';
import axios from 'axios';

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
        return await ctx.reply('Usage: !emojimix 😅+🤔');
      }

      const [emoji1, emoji2] = ctx.args[0].split('+');

      if (!emoji1 || !emoji2) {
        return await ctx.reply('Please provide two emojis separated by +');
      }

      await ctx.reply('⏳ Creating emoji mix...');

      const result = await stickerService.emojiMix(emoji1.trim(), emoji2.trim());

      if (result.success && result.data && result.data.stickers.length > 0) {
        for (const sticker of result.data.stickers) {
          try {
            const response = await axios.get(sticker.url, { responseType: 'arraybuffer' });
            const stickerBuffer = Buffer.from(response.data);
            const finalSticker = await stickerService.createSticker(stickerBuffer);

            if (finalSticker.success && finalSticker.data) {
                await ctx.reply({ sticker: finalSticker.data.buffer }, {
                packname: 'WhatsDeX Bot',
                author: 'CodeDeX',
                });
            }

            await new Promise(resolve => setTimeout(resolve, 1000));
          } catch (error: unknown) {
            logger.error('Error sending emoji mix sticker:', error instanceof Error ? error : new Error(String(error)));
            continue;
          }
        }

        logger.info(`Emoji mix created for ${ctx.sender.jid}: ${emoji1}+${emoji2}`);
      } else {
        await ctx.reply('Failed to create emoji mix. Please try different emojis.');
      }
    } catch (error: unknown) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Error in emojimix command:', err);
      await ctx.reply('Terjadi kesalahan saat membuat emoji mix. Silakan coba lagi.');
    }
  },
};