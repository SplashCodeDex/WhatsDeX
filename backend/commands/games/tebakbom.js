import gamesService from '../../src/services/gamesService.js';

/**
 * Tebak Bom Game Command
 * Interactive bomb guessing game with proper error handling and rate limiting
 */

export default {
  name: 'tebakbom',
  description: 'Interactive bomb guessing game',
  category: 'Games',
  usage: '!tebakbom',
  aliases: ['bom', 'tebakkbom'],
  cooldown: 30,

  execute: async (naze, m, { args, isPremium, isCreator }) => {
    try {
      const chatId = m.chat;
      const playerId = m.sender;

      // Check if user already has active game
      const activeGame = gamesService.getActiveGame(playerId, 'tebakbom');
      if (activeGame) {
        return m.reply('Kamu masih memiliki game tebakbom yang aktif!\nSelesaikan dulu ya.');
      }

      // Check rate limit
      if (!gamesService.checkRateLimit(playerId, 'tebakbom')) {
        return m.reply('Rate limit exceeded. Please wait before starting new game.');
      }

      // Start new game
      const gameResult = await gamesService.startTebakBom(chatId, playerId);

      if (gameResult.success) {
        await m.reply(gameResult.message);
        console.log(`Tebak bom game started for ${playerId} in ${chatId}`);
      } else {
        await m.reply('Failed to start game. Please try again.');
      }
    } catch (error) {
      console.error('Error in tebakbom command:', error);

      // Send error to user
      await m.reply('Terjadi kesalahan saat memulai game. Silakan coba lagi.');

      // Log detailed error for debugging
      if (error.message.includes('Rate limit')) {
        console.log(`Rate limit hit for ${m.sender}`);
      } else {
        console.error('Unexpected error in tebakbom:', error);
      }
    }
  },
};
