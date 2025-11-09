import mathQuizService from '../../src/services/mathQuizService.js';

/**
 * Math Quiz Command
 * Interactive math challenges with different difficulty levels
 */

export default {
  name: 'mathquiz',
  description: 'Interactive math quiz game',
  category: 'Education',
  usage: '!mathquiz <mode>',
  aliases: ['math', 'kuismath'],
  cooldown: 30,

  execute: async (naze, m, { args }) => {
    try {
      const mode = args[0]?.toLowerCase() || 'easy';
      const playerId = m.sender;

      // Check if user already has active quiz
      const activeQuiz = mathQuizService.getActiveQuiz(playerId);
      if (activeQuiz) {
        return m.reply('Kamu masih memiliki quiz matematika yang aktif!\nSelesaikan dulu ya.');
      }

      // Validate mode
      const availableModes = mathQuizService.getAvailableModes();
      if (!availableModes.includes(mode)) {
        const modeList = availableModes.map(m => `• ${m}`).join('\n');
        return m.reply(
          `Mode tidak valid!\n\nAvailable modes:\n${modeList}\n\nExample: !mathquiz medium`
        );
      }

      // Check rate limit
      if (!mathQuizService.checkRateLimit(playerId, 'mathquiz')) {
        return m.reply('Rate limit exceeded. Please wait before starting new quiz.');
      }

      // Start math quiz
      const result = await mathQuizService.startMathQuiz(m.chat, playerId, mode);

      if (result.success) {
        await m.reply(result.message);
        console.log(`Math quiz started for ${playerId} in ${m.chat} (mode: ${mode})`);
      } else {
        await m.reply('Failed to start math quiz. Please try again.');
      }
    } catch (error) {
      console.error('Error in mathquiz command:', error);

      if (error.message.includes('Rate limit')) {
        await m.reply('Rate limit exceeded. Please wait before starting new quiz.');
      } else if (error.message.includes('Invalid mode')) {
        await m.reply(
          'Invalid mode. Use: !mathquiz <mode>\nAvailable modes: noob, easy, medium, hard, extreme, impossible'
        );
      } else {
        await m.reply('Terjadi kesalahan saat memulai quiz matematika. Silakan coba lagi.');
      }

      console.error('Unexpected error in mathquiz:', error);
    }
  },
};
