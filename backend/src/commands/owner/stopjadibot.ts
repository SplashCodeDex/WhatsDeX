import multiBotService from '../../src/services/multiBotService';

/**
 * Stop JadiBot Command
 * Stop user's bot instance
 */

export default {
  name: 'stopjadibot',
  description: 'Stop your bot instance',
  category: 'Owner',
  usage: '!stopjadibot',
  aliases: ['stopbot', 'deljadibot'],
  cooldown: 10,

  execute: async (naze, m, { args }) => {
    try {
      const userId = m.sender;

      // Check if user has active bot
      if (!multiBotService.hasActiveBot(userId)) {
        return m.reply("You don't have an active bot instance!");
      }

      await m.reply('⏳ Stopping your bot instance...');

      // Stop bot instance
      const result = await multiBotService.stopBot(userId, 'manual');

      if (result.success) {
        await m.reply('✅ Bot instance stopped successfully!');
        console.log(`JadiBot stopped for ${userId}`);
      } else {
        await m.reply('Failed to stop bot instance. Please try again.');
      }
    } catch (error) {
      console.error('Error in stopjadibot command:', error);

      if (error.message.includes("don't have an active bot")) {
        await m.reply("You don't have an active bot instance!");
      } else {
        await m.reply('Terjadi kesalahan saat menghentikan bot instance. Silakan coba lagi.');
      }

      console.error('Unexpected error in stopjadibot:', error);
    }
  },
};
