import stickerService from '../../src/services/stickerService';

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

  execute: async (naze, m, { args }) => {
    try {
      const text = args.join(' ');

      if (!text || text.length === 0) {
        return m.reply('Please provide text for brat sticker');
      }

      if (text.length > 50) {
        return m.reply('Text too long. Maximum 50 characters.');
      }

      // Check rate limit
      if (!stickerService.checkRateLimit(m.sender, 'brat')) {
        return m.reply(
          'Rate limit exceeded. Please wait 15 seconds before using this command again.'
        );
      }

      await m.reply('⏳ Creating brat sticker...');

      // Create brat sticker
      const result = await stickerService.createBratSticker(text);

      if (result.success) {
        // Create final sticker
        const finalSticker = await stickerService.createSticker(result.buffer);

        await naze.sendAsSticker(m.chat, finalSticker.buffer, m, {
          packname: 'WhatsDeX Bot',
          author: 'CodeDeX',
        });

        console.log(`Brat sticker created for ${m.sender}: "${text}"`);
      } else {
        await m.reply('Failed to create brat sticker. Please try again.');
      }
    } catch (error) {
      console.error('Error in brat command:', error);

      if (error.message.includes('Rate limit')) {
        await m.reply('Rate limit exceeded. Please wait before using this command again.');
      } else if (error.message.includes('Text too long')) {
        await m.reply('Text too long. Please use shorter text (max 50 characters).');
      } else {
        await m.reply('Terjadi kesalahan saat membuat brat sticker. Silakan coba lagi.');
      }

      console.error('Unexpected error in brat:', error);
    }
  },
};
