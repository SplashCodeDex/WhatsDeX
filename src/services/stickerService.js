/**
 * Sticker Service - Advanced sticker creation features
 * Implements emojimix, brat, and other creative sticker features
 */

const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');
const { writeExif } = require('../../lib/exif');

class StickerService {
    constructor() {
        this.tempDir = path.join(process.cwd(), 'database', 'temp');
        this.rateLimits = new Map();
    }

    /**
     * Emoji Mix implementation
     * @param {string} emoji1 - First emoji
     * @param {string} emoji2 - Second emoji
     */
    async emojiMix(emoji1, emoji2) {
        try {
            if (!emoji1 || !emoji2) {
                throw new Error('Please provide two emojis to mix');
            }

            // Use Google's Emoji Kitchen API (Tenor)
            const response = await axios.get(
                `https://tenor.googleapis.com/v2/featured?key=LIVDSRZULELA&contentfilter=high&media_filter=png_transparent&component=proactive&collection=emoji_kitchen_v5&q=${encodeURIComponent(emoji1)}_${encodeURIComponent(emoji2)}`
            );

            if (!response.data.results || response.data.results.length === 0) {
                throw new Error(`Mix Emoji ${emoji1}+${emoji2} Tidak Ditemukan!`);
            }

            const stickers = [];

            // Get up to 3 mixed emoji results
            for (let i = 0; i < Math.min(3, response.data.results.length); i++) {
                const result = response.data.results[i];
                stickers.push({
                    url: result.url,
                    name: `emojimix_${i + 1}.png`
                });
            }

            return {
                success: true,
                stickers,
                message: `Berhasil membuat ${stickers.length} emoji mix untuk ${emoji1}+${emoji2}`
            };

        } catch (error) {
            console.error('Error in emoji mix:', error);

            if (error.response?.status === 429) {
                throw new Error('Rate limit exceeded. Please try again later.');
            }

            throw new Error('Failed to create emoji mix');
        }
    }

    /**
     * Brat sticker implementation
     * @param {string} text - Text to create brat sticker
     */
    async createBratSticker(text) {
        try {
            if (!text || text.length === 0) {
                throw new Error('Please provide text for brat sticker');
            }

            if (text.length > 50) {
                throw new Error('Text too long. Maximum 50 characters.');
            }

            // Use brat API
            const response = await axios.get(
                `https://aqul-brat.hf.space/?text=${encodeURIComponent(text)}`,
                { responseType: 'arraybuffer' }
            );

            return {
                success: true,
                buffer: Buffer.from(response.data),
                message: `Berhasil membuat brat sticker: "${text}"`
            };

        } catch (error) {
            console.error('Error creating brat sticker:', error);

            if (error.response?.status === 429) {
                throw new Error('Rate limit exceeded. Please try again later.');
            }

            throw new Error('Failed to create brat sticker');
        }
    }

    /**
     * Brat video implementation
     * @param {string} text - Text for brat video
     */
    async createBratVideo(text) {
        try {
            if (!text || text.length === 0) {
                throw new Error('Please provide text for brat video');
            }

            const words = text.split(' ');
            if (words.length > 10) {
                throw new Error('Text too long. Maximum 10 words.');
            }

            const tempDir = await this.ensureTempDir();
            const framePaths = [];

            // Create frames for each word
            for (let i = 0; i < words.length; i++) {
                const currentText = words.slice(0, i + 1).join(' ');

                try {
                    const response = await axios.get(
                        `https://aqul-brat.hf.space/?text=${encodeURIComponent(currentText)}`,
                        { responseType: 'arraybuffer' }
                    );

                    const framePath = path.join(tempDir, `brat_${Date.now()}_${i}.png`);
                    await fs.writeFile(framePath, Buffer.from(response.data));
                    framePaths.push(framePath);

                } catch (error) {
                    console.error(`Error creating frame ${i}:`, error);
                    continue;
                }
            }

            if (framePaths.length === 0) {
                throw new Error('Failed to create brat video frames');
            }

            // Create video from frames using ffmpeg
            const outputPath = path.join(tempDir, `brat_video_${Date.now()}.mp4`);

            return new Promise((resolve, reject) => {
                const { spawn } = require('child_process');

                // Create file list for ffmpeg
                const fileListPath = path.join(tempDir, `filelist_${Date.now()}.txt`);
                let fileListContent = '';

                framePaths.forEach((framePath, index) => {
                    fileListContent += `file '${framePath}'\n`;
                    fileListContent += `duration 0.5\n`;
                });

                // Add last frame for 3 seconds
                fileListContent += `file '${framePaths[framePaths.length - 1]}'\n`;
                fileListContent += `duration 3\n`;

                // Write file list
                require('fs').writeFileSync(fileListPath, fileListContent);

                // Create video using ffmpeg
                const ffmpeg = spawn('ffmpeg', [
                    '-y',
                    '-f', 'concat',
                    '-safe', '0',
                    '-i', fileListPath,
                    '-vf', 'fps=30',
                    '-c:v', 'libx264',
                    '-preset', 'veryfast',
                    '-pix_fmt', 'yuv420p',
                    '-t', '00:00:10',
                    outputPath
                ]);

                let stderr = '';
                ffmpeg.stderr.on('data', (data) => {
                    stderr += data.toString();
                });

                ffmpeg.on('close', async (code) => {
                    try {
                        // Cleanup frame files and file list
                        await Promise.all([
                            ...framePaths.map(p => fs.unlink(p).catch(() => {})),
                            fs.unlink(fileListPath).catch(() => {})
                        ]);

                        if (code === 0) {
                            const videoBuffer = await fs.readFile(outputPath);
                            await fs.unlink(outputPath).catch(() => {});

                            resolve({
                                success: true,
                                buffer: videoBuffer,
                                message: `Berhasil membuat brat video: "${text}"`
                            });
                        } else {
                            reject(new Error(`FFmpeg error: ${stderr}`));
                        }
                    } catch (error) {
                        reject(error);
                    }
                });

                ffmpeg.on('error', (error) => {
                    reject(error);
                });
            });

        } catch (error) {
            console.error('Error creating brat video:', error);
            throw new Error('Failed to create brat video');
        }
    }

    /**
     * Create sticker with custom text and author
     * @param {Buffer} mediaBuffer - Media buffer
     * @param {Object} options - Sticker options
     */
    async createSticker(mediaBuffer, options = {}) {
        try {
            const {
                packname = 'WhatsDeX Bot',
                author = 'CodeDeX',
                categories = []
            } = options;

            const stickerBuffer = await writeExif(mediaBuffer, {
                packname,
                author,
                categories
            });

            return {
                success: true,
                buffer: stickerBuffer,
                message: 'Sticker berhasil dibuat'
            };

        } catch (error) {
            console.error('Error creating sticker:', error);
            throw new Error('Failed to create sticker');
        }
    }

    /**
     * Download and process media for sticker creation
     * @param {string} url - Media URL
     */
    async downloadMediaForSticker(url) {
        try {
            const response = await axios.get(url, {
                responseType: 'arraybuffer',
                timeout: 30000
            });

            return Buffer.from(response.data);

        } catch (error) {
            console.error('Error downloading media for sticker:', error);
            throw new Error('Failed to download media');
        }
    }

    /**
     * Ensure temp directory exists
     */
    async ensureTempDir() {
        try {
            await fs.access(this.tempDir);
        } catch (error) {
            await fs.mkdir(this.tempDir, { recursive: true });
        }
        return this.tempDir;
    }

    /**
     * Check rate limit for sticker operations
     * @param {string} userId - User ID
     * @param {string} operation - Operation type
     */
    async checkRateLimit(userId, operation) {
        const limits = {
            'emojimix': { cooldown: 10000, maxPerCooldown: 3 },
            'brat': { cooldown: 15000, maxPerCooldown: 2 },
            'bratvideo': { cooldown: 30000, maxPerCooldown: 1 },
        };
        const config = limits[operation] || { cooldown: 30000, maxPerCooldown: 1 };

        const key = `${userId}_${operation}`;
        const now = new Date();
        const expiresAt = new Date(now.getTime() + config.cooldown);

        const rateLimit = await prisma.rateLimit.upsert({
            where: { key },
            update: { count: { increment: 1 } },
            create: { key, count: 1, expiresAt },
        });

        if (rateLimit.expiresAt < now) {
            await prisma.rateLimit.update({
                where: { key },
                data: { count: 1, expiresAt },
            });
            return true;
        }

        return rateLimit.count <= config.maxPerCooldown;
    }

    /**
     * Clean up old temp files
     */
    async cleanupTempFiles() {
        try {
            const tempDir = await this.ensureTempDir();
            const files = await fs.readdir(tempDir);

            const now = Date.now();
            const maxAge = 24 * 60 * 60 * 1000; // 24 hours

            for (const file of files) {
                const filePath = path.join(tempDir, file);
                const stats = await fs.stat(filePath);

                if (now - stats.mtime.getTime() > maxAge) {
                    await fs.unlink(filePath).catch(() => {});
                }
            }

        } catch (error) {
            console.error('Error cleaning up temp files:', error);
        }
    }
}

module.exports = new StickerService();