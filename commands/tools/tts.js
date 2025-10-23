/**
 * Text-to-Speech Command
 * Convert text to audio with multiple language support
 */

const textToSpeechService = require('../../src/services/textToSpeechService');

module.exports = {
    name: 'tts',
    description: 'Convert text to speech',
    category: 'Tools',
    usage: '!tts <text> [--lang <language>]',
    aliases: ['texttospeech', 'tospeech'],
    cooldown: 10,

    execute: async (naze, m, { args, text }) => {
        try {
            // Parse arguments
            let targetText = '';
            let language = 'id';

            // Check for language flag
            if (text.includes('--lang')) {
                const parts = text.split('--lang');
                targetText = parts[0].trim();
                const langPart = parts[1]?.trim();

                if (langPart) {
                    const langMatch = langPart.match(/^(\w+)/);
                    if (langMatch) {
                        language = langMatch[1].toLowerCase();
                    }
                }
            } else {
                targetText = text;
            }

            if (!targetText || targetText.length === 0) {
                return m.reply('Please provide text to convert to speech\n\nUsage: !tts <text> [--lang <language>]\nExample: !tts Halo dunia --lang en');
            }

            // Validate language
            if (!textToSpeechService.validateLanguage(language)) {
                const available = textToSpeechService.getAvailableLanguages();
                const langList = Object.entries(available).map(([code, name]) => `• ${code}: ${name}`).join('\n');
                return m.reply(`Invalid language code!\n\nAvailable languages:\n${langList}\n\nExample: !tts Hello world --lang en`);
            }

            // Check rate limit
            if (!textToSpeechService.checkRateLimit('tts_global')) {
                return m.reply('Rate limit exceeded. Please wait 5 seconds before using TTS again.');
            }

            await m.reply('⏳ Converting text to speech...');

            // Convert text to speech
            const result = await textToSpeechService.textToSpeech(targetText, language);

            if (result.success) {
                // Send audio
                await m.reply({
                    audio: result.buffer,
                    mimetype: 'audio/mpeg',
                    ptt: false
                });

                console.log(`TTS executed for ${m.sender}: "${targetText.substring(0, 50)}..." (${language})`);
            } else {
                await m.reply('Failed to convert text to speech. Please try again.');
            }

        } catch (error) {
            console.error('Error in TTS command:', error);

            if (error.message.includes('Rate limit')) {
                await m.reply('Rate limit exceeded. Please wait before using TTS again.');
            } else if (error.message.includes('Text too long')) {
                await m.reply('Text too long. Please use shorter text (max 500 characters).');
            } else if (error.message.includes('TTS service rate limit')) {
                await m.reply('TTS service is busy. Please try again in a few moments.');
            } else {
                await m.reply('Terjadi kesalahan saat mengconvert teks ke suara. Silakan coba lagi.');
            }

            console.error('Unexpected error in TTS:', error);
        }
    }
};