/**
 * Akinator Game Command
 * AI guessing game with proper error handling and rate limiting
 */

const gamesService = require('../../src/services/gamesService');

module.exports = {
  name: 'akinator',
  description: 'AI guessing game',
  category: 'Games',
  usage: '!akinator start',
  aliases: ['aki'],
  cooldown: 60,

  execute: async (naze, m, { args, isPremium, isCreator }) => {
    try {
      const playerId = m.sender;
      const action = args[0]?.toLowerCase() || 'start';

      if (action === 'start') {
        // Check if user already has active akinator game
        const activeGame = gamesService.getActiveGame(playerId, 'akinator');
        if (activeGame) {
          return m.reply('Kamu masih memiliki game akinator yang aktif!\nSelesaikan dulu ya.');
        }

        // Check rate limit
        if (!gamesService.checkRateLimit(playerId, 'akinator')) {
          return m.reply('Rate limit exceeded. Please wait before starting new game.');
        }

        // Start new akinator game
        const gameResult = await gamesService.startAkinator(playerId);

        if (gameResult.success) {
          await m.reply(gameResult.message);
          console.log(`Akinator game started for ${playerId}`);
        } else {
          await m.reply('Failed to start akinator game. Please try again.');
        }
      } else if (action === 'end' || action === 'stop') {
        // End current game
        const activeGame = gamesService.getActiveGame(playerId, 'akinator');
        if (activeGame) {
          await gamesService.endGame(activeGame.gameId, 'manual');
          await m.reply('Sukses mengakhiri sesi akinator');
        } else {
          await m.reply('Kamu tidak sedang bermain akinator!');
        }
      } else {
        await m.reply('Usage: !akinator start|end');
      }
    } catch (error) {
      console.error('Error in akinator command:', error);

      if (error.message.includes('Rate limit')) {
        await m.reply('Rate limit exceeded. Please wait before starting new game.');
      } else if (error.message.includes('Failed to start')) {
        await m.reply('Server akinator sedang bermasalah. Silakan coba lagi nanti.');
      } else {
        await m.reply('Terjadi kesalahan saat menjalankan game. Silakan coba lagi.');
      }

      console.error('Unexpected error in akinator:', error);
    }
  },
};
