import funCommandsService from '../../src/services/funCommandsService.js';

/**
 * Cek Khodam Command
 * Mystical entity checking fun command
 */

export default {
  name: 'cekkhodam',
  description: 'Check mystical entity',
  category: 'Fun',
  usage: '!cekkhodam <name>',
  aliases: ['khodam'],
  cooldown: 15,

  execute: async (naze, m, { args }) => {
    try {
      const targetName = args.join(' ') || m.pushName || 'kamu';

      // Check rate limit
      if (!funCommandsService.checkRateLimit(m.sender, 'cekkhodam')) {
        return m.reply(
          'Rate limit exceeded. Please wait 30 seconds before using this command again.'
        );
      }

      // Get khodam analysis
      const result = await funCommandsService.cekKhodam(targetName);

      if (result.success) {
        await m.reply(result.result);
        console.log(`Cek khodam executed for ${targetName} by ${m.sender}`);
      } else {
        await m.reply('Failed to check khodam. Please try again.');
      }
    } catch (error) {
      console.error('Error in cekkhodam command:', error);

      if (error.message.includes('Rate limit')) {
        await m.reply('Rate limit exceeded. Please wait before using this command again.');
      } else {
        await m.reply('Terjadi kesalahan saat mengecek khodam. Silakan coba lagi.');
      }

      console.error('Unexpected error in cekkhodam:', error);
    }
  },
};
