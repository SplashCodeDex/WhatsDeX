import funCommandsService from '../../src/services/funCommandsService.js';

/**
 * Cek Sifat Command
 * Personality analysis fun command with proper error handling
 */

export default {
  name: 'ceksifat',
  description: 'Analyze personality traits',
  category: 'Fun',
  usage: '!ceksifat <name>',
  aliases: ['sifat'],
  cooldown: 10,

  execute: async (naze, m, { args, text }) => {
    try {
      const targetName = args.join(' ') || m.pushName || 'kamu';

      // Check rate limit
      if (!funCommandsService.checkRateLimit(m.sender, 'ceksifat')) {
        return m.reply(
          'Rate limit exceeded. Please wait 30 seconds before using this command again.'
        );
      }

      // Get personality analysis
      const result = await funCommandsService.cekSifat(targetName);

      if (result.success) {
        await m.reply(result.result);
        console.log(`Cek sifat executed for ${targetName} by ${m.sender}`);
      } else {
        await m.reply('Failed to analyze personality. Please try again.');
      }
    } catch (error) {
      console.error('Error in ceksifat command:', error);

      if (error.message.includes('Rate limit')) {
        await m.reply('Rate limit exceeded. Please wait before using this command again.');
      } else {
        await m.reply('Terjadi kesalahan saat menganalisis sifat. Silakan coba lagi.');
      }

      console.error('Unexpected error in ceksifat:', error);
    }
  },
};
