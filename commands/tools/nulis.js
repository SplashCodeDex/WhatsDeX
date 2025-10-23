/**
 * Writing/Handwriting Command
 * Create custom text images with different fonts and templates
 */

const writingService = require('../../src/services/writingService');

module.exports = {
    name: 'nulis',
    description: 'Create handwriting/writing images',
    category: 'Tools',
    usage: '!nulis <text> [--template <template>] [--font <font>]',
    aliases: ['writing', 'handwriting'],
    cooldown: 30,

    execute: async (naze, m, { args, text }) => {
        try {
            // Parse arguments
            let targetText = '';
            let template = 'buku-kiri';
            let font = 'indie';

            if (text.includes('--template')) {
                const parts = text.split('--template');
                targetText = parts[0].trim();
                const templatePart = parts[1]?.trim();

                if (templatePart) {
                    const templateMatch = templatePart.match(/^(\w+(-\w+)?)/);
                    if (templateMatch) {
                        template = templateMatch[1].toLowerCase();
                    }
                }
            } else if (text.includes('--font')) {
                const parts = text.split('--font');
                targetText = parts[0].trim();
                const fontPart = parts[1]?.trim();

                if (fontPart) {
                    const fontMatch = fontPart.match(/^(\w+)/);
                    if (fontMatch) {
                        font = fontMatch[1].toLowerCase();
                    }
                }
            } else {
                targetText = text;
            }

            if (!targetText || targetText.length === 0) {
                // Show available options
                const templates = writingService.getAvailableTemplates();
                const fonts = writingService.getAvailableFonts();

                const templateList = templates.map(t => `• ${t.id}: ${t.name}`).join('\n');
                const fontList = fonts.map(f => `• ${f.id}: ${f.name}`).join('\n');

                return m.reply(`Please provide text to write!\n\nUsage: !nulis <text> [--template <template>] [--font <font>]\n\nAvailable Templates:\n${templateList}\n\nAvailable Fonts:\n${fontList}\n\nExample: !nulis Halo dunia --template buku-kanan --font impact`);
            }

            // Validate template
            const availableTemplates = writingService.getAvailableTemplates();
            const validTemplate = availableTemplates.find(t => t.id === template);

            if (!validTemplate) {
                const templateList = availableTemplates.map(t => `• ${t.id}: ${t.name}`).join('\n');
                return m.reply(`Invalid template!\n\nAvailable Templates:\n${templateList}\n\nExample: !nulis Halo dunia --template buku-kanan`);
            }

            // Validate font
            const availableFonts = writingService.getAvailableFonts();
            const validFont = availableFonts.find(f => f.id === font);

            if (!validFont) {
                const fontList = availableFonts.map(f => `• ${f.id}: ${f.name}`).join('\n');
                return m.reply(`Invalid font!\n\nAvailable Fonts:\n${fontList}\n\nExample: !nulis Halo dunia --font impact`);
            }

            // Check rate limit
            if (!writingService.checkRateLimit('writing')) {
                return m.reply('Rate limit exceeded. Please wait 30 seconds before creating new writing.');
            }

            await m.reply('⏳ Creating handwriting...');

            // Create writing
            const result = await writingService.createWriting(targetText, template, font);

            if (result.success) {
                // Send image
                await m.reply({
                    image: result.buffer,
                    caption: `Handwriting: "${targetText.substring(0, 50)}${targetText.length > 50 ? '...' : ''}"\nTemplate: ${validTemplate.name}\nFont: ${validFont.name}`
                });

                console.log(`Writing created for ${m.sender}: "${targetText.substring(0, 50)}..." (${template}, ${font})`);
            } else {
                await m.reply('Failed to create writing. Please try again.');
            }

        } catch (error) {
            console.error('Error in nulis command:', error);

            if (error.message.includes('Rate limit')) {
                await m.reply('Rate limit exceeded. Please wait before creating new writing.');
            } else if (error.message.includes('Text too long')) {
                await m.reply('Text too long. Please use shorter text (max 500 characters).');
            } else if (error.message.includes('Invalid template') || error.message.includes('Invalid font')) {
                await m.reply(error.message);
            } else if (error.message.includes('ImageMagick')) {
                await m.reply('Image processing error. Please try again later.');
            } else {
                await m.reply('Terjadi kesalahan saat membuat tulisan. Silakan coba lagi.');
            }

            console.error('Unexpected error in nulis:', error);
        }
    }
};