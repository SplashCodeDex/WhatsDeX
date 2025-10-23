/**
 * List JadiBot Command
 * List all active bot instances
 */

const multiBotService = require('../../src/services/multiBotService');

module.exports = {
    name: 'listjadibot',
    description: 'List all active bot instances',
    category: 'Owner',
    usage: '!listjadibot',
    aliases: ['listbots', 'bots'],
    cooldown: 10,

    execute: async (naze, m, { args, isCreator }) => {
        try {
            // Get active bots
            const activeBots = multiBotService.getActiveBots();
            const stats = multiBotService.getStats();

            if (activeBots.length === 0) {
                return m.reply('No active bot instances found.');
            }

            let response = '🤖 *Active Bot Instances*\n\n';
            response += `Total Bots: ${stats.activeBots}\n`;
            response += `Running Processes: ${stats.runningProcesses}\n\n`;

            activeBots.forEach((bot, index) => {
                const createdAt = new Date(bot.createdAt).toLocaleString();
                const status = bot.isActive ? '🟢 Active' : '🟡 Inactive';

                response += `${index + 1}. @${bot.userId.split('@')[0]}\n`;
                response += `   Status: ${status}\n`;
                response += `   Created: ${createdAt}\n`;
                if (bot.reconnectAttempts > 0) {
                    response += `   Reconnect Attempts: ${bot.reconnectAttempts}\n`;
                }
                response += '\n';
            });

            await m.reply(response);

            console.log(`List jadibot requested by ${m.sender}, found ${activeBots.length} bots`);

        } catch (error) {
            console.error('Error in listjadibot command:', error);

            await m.reply('Terjadi kesalahan saat mengambil daftar bot. Silakan coba lagi.');

            console.error('Unexpected error in listjadibot:', error);
        }
    }
};