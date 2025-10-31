/**
 * Writing Service - Create custom text images and handwriting
 * Implements writing/handwriting features with multiple fonts and templates
 */

import path from 'path';

const fs = require('fs').promises;
const { spawn } = require('child_process');
const context = require('../../context');

class WritingService {
  constructor() {
    this.templates = {
      'buku-kiri': {
        image: path.join(__dirname, '../../assets/writing/book-left.jpg'),
        font: 'Indie-Flower.ttf',
        position: { x: 140, y: 153 },
        size: '960x1280',
        pointsize: 23,
        interline: 2,
      },
      'buku-kanan': {
        image: path.join(__dirname, '../../assets/writing/book-right.jpg'),
        font: 'Indie-Flower.ttf',
        position: { x: 128, y: 129 },
        size: '960x1280',
        pointsize: 23,
        interline: 2,
      },
      'folio-kiri': {
        image: path.join(__dirname, '../../assets/writing/folio-left.jpg'),
        font: 'Indie-Flower.ttf',
        position: { x: 48, y: 185 },
        size: '1720x1280',
        pointsize: 23,
        interline: 4,
      },
      'folio-kanan': {
        image: path.join(__dirname, '../../assets/writing/folio-right.jpg'),
        font: 'Indie-Flower.ttf',
        position: { x: 89, y: 190 },
        size: '1720x1280',
        pointsize: 23,
        interline: 4,
      },
    };

    this.fonts = {
      indie: 'Indie-Flower.ttf',
      impact: 'impact.ttf',
      obelix: 'ObelixProBIt-cyr.ttf',
    };

    this.rateLimits = new Map();
    this.tempDir = path.join(process.cwd(), 'database', 'writing');
  }

  /**
   * Initialize service
   */
  async initialize() {
    try {
      await this.ensureTempDir();
      await this.ensureAssets();
    } catch (error) {
      console.error('Error initializing writing service:', error);
    }
  }

  /**
   * Create writing/handwriting image
   * @param {string} text - Text to write
   * @param {string} template - Template type (buku-kiri, buku-kanan, folio-kiri, folio-kanan)
   * @param {string} font - Font type (indie, impact, obelix)
   */
  async createWriting(text, template = 'buku-kiri', font = 'indie') {
    try {
      if (!text || text.length === 0) {
        throw new Error('Please provide text to write');
      }

      if (text.length > 500) {
        throw new Error('Text too long. Maximum 500 characters.');
      }

      // Check rate limit from database
      if (!(await this.checkRateLimit('writing'))) {
        throw new Error('Rate limit exceeded. Please wait before creating new writing.');
      }

      const templateConfig = this.templates[template];
      const fontFile = this.fonts[font];

      if (!templateConfig) {
        throw new Error(`Invalid template: ${template}`);
      }

      if (!fontFile) {
        throw new Error(`Invalid font: ${font}`);
      }

      // Process text for ImageMagick
      const processedText = text.replace(/(\S+\s*){1,9}/g, '$&\n');
      const fixHeight = processedText.split('\n').slice(0, 31).join('\n');

      const tempDir = await this.ensureTempDir();
      const outputPath = path.join(tempDir, `writing_${Date.now()}.jpg`);

      // Use ImageMagick to create the writing
      return new Promise((resolve, reject) => {
        const convert = spawn('convert', [
          templateConfig.image,
          '-font',
          path.join(__dirname, '../../assets/fonts', fontFile),
          '-size',
          templateConfig.size,
          '-pointsize',
          templateConfig.pointsize,
          '-interline-spacing',
          templateConfig.interline,
          '-annotate',
          `+${templateConfig.position.x}+${templateConfig.position.y}`,
          fixHeight,
          outputPath,
        ]);

        let stderr = '';
        convert.stderr.on('data', data => {
          stderr += data.toString();
        });

        convert.on('close', async code => {
          if (code === 0) {
            try {
              const resultBuffer = await fs.readFile(outputPath);
              await fs.unlink(outputPath).catch(() => {});

              resolve({
                success: true,
                buffer: resultBuffer,
                text,
                template,
                font,
                message: `Berhasil membuat tulisan: "${text.substring(0, 50)}${text.length > 50 ? '...' : ''}"`,
              });
            } catch (error) {
              reject(new Error('Failed to read output file'));
            }
          } else {
            reject(new Error(`ImageMagick error: ${stderr}`));
          }
        });

        convert.on('error', error => {
          reject(error);
        });
      });
    } catch (error) {
      console.error('Error creating writing:', error);
      throw error;
    }
  }

  /**
   * Get available templates
   */
  getAvailableTemplates() {
    return Object.keys(this.templates).map(template => ({
      id: template,
      name: template.replace('-', ' ').toUpperCase(),
      description: this.getTemplateDescription(template),
    }));
  }

  /**
   * Get template description
   * @param {string} template - Template ID
   */
  getTemplateDescription(template) {
    const descriptions = {
      'buku-kiri': 'Left page book template',
      'buku-kanan': 'Right page book template',
      'folio-kiri': 'Left page folio template',
      'folio-kanan': 'Right page folio template',
    };
    return descriptions[template] || 'Unknown template';
  }

  /**
   * Get available fonts
   */
  getAvailableFonts() {
    return Object.entries(this.fonts).map(([id, file]) => ({
      id,
      name: id.charAt(0).toUpperCase() + id.slice(1),
      file,
    }));
  }

  /**
   * Check rate limit for writing operations (now uses database)
   * @param {string} operation - Operation type
   */
  async checkRateLimit(operation) {
    const key = `writing_${operation}`;
    const now = Date.now();
    const cooldown = 30000; // 30 seconds
    const maxPerCooldown = 3;

    try {
      const existingLimit = await context.database.rateLimit.findUnique({
        where: { key },
      });

      if (!existingLimit || now - existingLimit.lastUsed.getTime() > cooldown) {
        await context.database.rateLimit.upsert({
          where: { key },
          update: {
            count: 1,
            lastUsed: new Date(),
          },
          create: {
            key,
            count: 1,
            lastUsed: new Date(),
          },
        });
        return true;
      }

      if (existingLimit.count >= maxPerCooldown) {
        return false;
      }

      await context.database.rateLimit.update({
        where: { key },
        data: {
          count: { increment: 1 },
          lastUsed: new Date(),
        },
      });

      return true;
    } catch (error) {
      console.error('Error checking writing rate limit:', error);
      return false; // Fail safe
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
   * Ensure assets directory and files exist
   */
  async ensureAssets() {
    try {
      const assetsDir = path.join(__dirname, '../../assets');
      const fontsDir = path.join(assetsDir, 'fonts');
      const writingDir = path.join(assetsDir, 'writing');

      // Create directories if they don't exist
      await fs.mkdir(fontsDir, { recursive: true });
      await fs.mkdir(writingDir, { recursive: true });

      // Copy font files if they don't exist
      for (const [fontId, fontFile] of Object.entries(this.fonts)) {
        const sourcePath = path.join(__dirname, '../../lib/fonts', fontFile);
        const destPath = path.join(fontsDir, fontFile);

        try {
          await fs.access(sourcePath);
          await fs.copyFile(sourcePath, destPath);
        } catch (error) {
          console.warn(`Font file ${fontFile} not found at ${sourcePath}`);
        }
      }

      // Copy template images if they don't exist
      for (const [templateId, config] of Object.entries(this.templates)) {
        const imageName = config.image.split('/').pop();
        const sourcePath = path.join(__dirname, '../../lib/writing', imageName);
        const destPath = path.join(writingDir, imageName);

        try {
          await fs.access(sourcePath);
          await fs.copyFile(sourcePath, destPath);
          // Update config to point to new location
          this.templates[templateId].image = destPath;
        } catch (error) {
          console.warn(`Template image ${imageName} not found at ${sourcePath}`);
        }
      }
    } catch (error) {
      console.error('Error ensuring assets:', error);
    }
  }

  /**
   * Clean up old writing files
   */
  async cleanupOldFiles() {
    try {
      const tempDir = await this.ensureTempDir();
      const files = await fs.readdir(tempDir);

      const now = Date.now();
      const maxAge = 60 * 60 * 1000; // 1 hour

      for (const file of files) {
        if (file.startsWith('writing_') && file.endsWith('.jpg')) {
          const filePath = path.join(tempDir, file);
          const stats = await fs.stat(filePath);

          if (now - stats.mtime.getTime() > maxAge) {
            await fs.unlink(filePath).catch(() => {});
          }
        }
      }
    } catch (error) {
      console.error('Error cleaning up writing files:', error);
    }
  }
}

module.exports = new WritingService();
