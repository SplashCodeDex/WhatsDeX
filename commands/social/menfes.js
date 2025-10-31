/**
 * Menfes Command
 * Anonymous messaging system
 */

const menfesService = require('../../src/services/menfesService');

module.exports = {
  name: 'menfes',
  description: 'Start anonymous messaging session',
  category: 'Social',
  usage: '!menfes <number>|<fake_name>',
  aliases: ['confes', 'anonymous'],
  cooldown: 60,

  execute: async (naze, m, { args, text }) => {
    try {
      if (!text || !text.includes('|')) {
        return m.reply(
          'Usage: !menfes 628xxxx|Samarinda\n\nFormat: !menfes <nomor_tujuan>|<nama_samaran>'
        );
      }

      const [targetNumber, fakeName] = text.split('|').map(s => s.trim());

      if (!targetNumber || !fakeName) {
        return m.reply('Please provide both target number and fake name');
      }

      // Validate target number
      const cleanNumber = targetNumber.replace(/\D/g, '');
      if (cleanNumber.length < 10 || cleanNumber.length > 15) {
        return m.reply('Invalid phone number format');
      }

      // Check if user already has active session
      const activeSession = menfesService.getActiveSession(m.sender);
      if (activeSession) {
        return m.reply(
          'Kamu sudah memiliki sesi menfes yang aktif!\nKetik !delmenfes untuk mengakhiri sesi.'
        );
      }

      // Start menfes session
      const result = await menfesService.startMenfesSession(m.sender, cleanNumber, fakeName);

      if (result.success) {
        await m.reply(result.message);
        console.log(`Menfes session started: ${m.sender} -> ${cleanNumber} (${fakeName})`);
      } else {
        await m.reply('Failed to start menfes session. Please try again.');
      }
    } catch (error) {
      console.error('Error in menfes command:', error);

      if (error.message.includes('Rate limit')) {
        await m.reply('Rate limit exceeded. Please wait before starting new session.');
      } else if (error.message.includes('Invalid phone number')) {
        await m.reply('Invalid phone number format. Please check the number.');
      } else if (error.message.includes('Sesi menfes')) {
        await m.reply(error.message);
      } else {
        await m.reply('Terjadi kesalahan saat memulai menfes. Silakan coba lagi.');
      }

      console.error('Unexpected error in menfes:', error);
    }
  },
};
