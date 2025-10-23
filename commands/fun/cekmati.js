/**
 * Cek Mati Command
 * Age prediction fun command
 */

const funCommandsService = require('../../src/services/funCommandsService');

module.exports = {
    name: 'cekmati',
    description: 'Predict death age',
    category: 'Fun',
    usage: '!cekmati <name>',
    aliases: ['mati'],
    cooldown: 20,

    execute: async (naze, m, { args }) => {
        try {
            const targetName = args.join(' ') || m.pushName || 'kamu';

            // Check rate limit
            if (!funCommandsService.checkRateLimit(m.sender, 'cekmati')) {
                return m.reply('Rate limit exceeded. Please wait 30 seconds before using this command again.');
            }

            // Get death age prediction
            const result = await funCommandsService.cekMati(targetName);

            if (result.success) {
                await m.reply(result.result);
                console.log(`Cek mati executed for ${targetName} by ${m.sender}`);
            } else {
                await m.reply('Failed to predict age. Please try again.');
            }

        } catch (error) {
            console.error('Error in cekmati command:', error);

            if (error.message.includes('Rate limit')) {
                await m.reply('Rate limit exceeded. Please wait before using this command again.');
            } else if (error.response?.status === 429) {
                await m.reply('API rate limit exceeded. Please try again later.');
            } else {
                await m.reply('Terjadi kesalahan saat memprediksi umur. Silakan coba lagi.');
            }

            console.error('Unexpected error in cekmati:', error);
        }
    }
};