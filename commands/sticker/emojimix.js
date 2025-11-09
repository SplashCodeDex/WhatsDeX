import stickerService from '../../src/services/stickerService.js';

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

  execute: async (naze, m, { args }) => {
    try {
      if (!args[0] || !args[0].includes('+')) {
        return m.reply('Usage: !emojimix 😅+🤔');
      }

      const [emoji1, emoji2] = args[0].split('+');

      if (!emoji1 || !emoji2) {
        return m.reply('Please provide two emojis separated by +');
      }

      // Check rate limit
      if (!stickerService.checkRateLimit(m.sender, 'emojimix')) {
        return m.reply(
          'Rate limit exceeded. Please wait 10 seconds before using this command again.'
        );
      }

      await m.reply('⏳ Creating emoji mix...');

      // Get emoji mix results
      const result = await stickerService.emojiMix(emoji1.trim(), emoji2.trim());

      if (result.success && result.stickers.length > 0) {
        // Send each sticker
        for (const sticker of result.stickers) {
          try {
            const stickerBuffer = await stickerService.downloadMediaForSticker(sticker.url);
            const finalSticker = await stickerService.createSticker(stickerBuffer);

            await naze.sendAsSticker(m.chat, finalSticker.buffer, m, {
              packname: 'WhatsDeX Bot',
              author: 'CodeDeX',
            });

            // Small delay between stickers
            await new Promise(resolve => setTimeout(resolve, 1000));
          } catch (error) {
            console.error('Error sending emoji mix sticker:', error);
            continue;
          }
        }

        console.log(`Emoji mix created for ${m.sender}: ${emoji1}+${emoji2}`);
      } else {
        await m.reply('Failed to create emoji mix. Please try different emojis.');
      }
    } catch (error) {
      console.error('Error in emojimix command:', error);

      if (error.message.includes('Rate limit')) {
        await m.reply('Rate limit exceeded. Please wait before using this command again.');
      } else if (error.message.includes('Tidak Ditemukan')) {
        await m.reply('Emoji mix not found. Please try different emoji combination.');
      } else {
        await m.reply('Terjadi kesalahan saat membuat emoji mix. Silakan coba lagi.');
      }

      console.error('Unexpected error in emojimix:', error);
    }
  },
};
