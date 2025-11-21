import multiBotService from '../../src/services/multiBotService.js';

/**
 * JadiBot Command
 * Allow users to create their own bot instances
 */

export default {
  name: 'jadibot',
  description: 'Create your own bot instance',
  category: 'Owner',
  usage: '!jadibot',
  aliases: ['createbot', 'multibot'],
  cooldown: 60,

  execute: async (naze, m, { args, isPremium, isCreator }) => {
    try {
      const userId = m.sender;

      // Check if user already has active bot
      if (multiBotService.hasActiveBot(userId)) {
        return m.reply(
          'You already have an active bot instance!\nUse !stopjadibot to stop your current bot.'
        );
      }

      // Check if user is premium (optional requirement)
      if (!isPremium && !isCreator) {
        return m.reply(
          'This feature requires premium access.\nContact admin to get premium access.'
        );
      }

      await m.reply('⏳ Creating your bot instance...\nThis may take a few moments.');

      // Create bot instance
      const result = await multiBotService.createBot(userId, naze);

      if (result.success) {
        await m.reply(`${result.message}\n\nUse !stopjadibot to stop your bot instance.`);
        console.log(`JadiBot created for ${userId}`);
      } else {
        await m.reply('Failed to create bot instance. Please try again.');
      }
    } catch (error) {
      console.error('Error in jadibot command:', error);

      if (error.message.includes('Rate limit')) {
        await m.reply('Rate limit exceeded. Please wait before creating new bot.');
      } else if (error.message.includes('already have an active bot')) {
        await m.reply(
          'You already have an active bot instance!\nUse !stopjadibot to stop your current bot.'
        );
      } else if (error.message.includes('requires premium')) {
        await m.reply('This feature requires premium access.');
      } else {
        await m.reply('Terjadi kesalahan saat membuat bot instance. Silakan coba lagi.');
      }

      console.error('Unexpected error in jadibot:', error);
    }
  },
};
