/**
 * Text-to-Speech Service - Convert text to audio
 * Implements TTS functionality with proper error handling and rate limiting
 */

import path from 'path';
import axios from 'axios';
import { promises as fs } from 'fs';
import context from '../../context.js';

class TextToSpeechService {
  constructor() {
    this.rateLimits = new Map();
    this.tempDir = path.join(process.cwd(), 'database', 'tts');
  }

  /**
   * Initialize service
   */
  async initialize() {
    try {
      await this.ensureTempDir();
    } catch (error) {
      console.error('Error initializing TTS service:', error);
    }
  }

  /**
   * Convert text to speech
   * @param {string} text - Text to convert
   * @param {string} language - Language code (default: 'id')
   */
  async textToSpeech(text, language = 'id') {
    try {
      if (!text || text.length === 0) {
        throw new Error('Please provide text to convert');
      }

      if (text.length > 500) {
        throw new Error('Text too long. Maximum 500 characters.');
      }

      // Check rate limit from database
      if (!(await this.checkRateLimit('tts_global'))) {
        throw new Error('Rate limit exceeded. Please wait before using TTS again.');
      }

      // Use Google Translate TTS API
      const ttsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=${language}&q=${encodeURIComponent(text)}`;

      const response = await axios.get(ttsUrl, {
        responseType: 'arraybuffer',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          Referer: 'https://translate.google.com/',
        },
        timeout: 30000,
      });

      if (response.data.length < 100) {
        throw new Error('TTS generation failed - empty response');
      }

      return {
        success: true,
        buffer: Buffer.from(response.data),
        text,
        language,
        message: `Berhasil mengconvert teks ke suara: "${text.substring(0, 50)}${text.length > 50 ? '...' : ''}"`,
      };
    } catch (error) {
      console.error('Error in text-to-speech:', error);

      if (error.message.includes('Rate limit')) {
        throw error;
      }

      if (error.response?.status === 429) {
        throw new Error('TTS service rate limit exceeded. Please try again later.');
      }

      throw new Error('Failed to convert text to speech');
    }
  }

  /**
   * Convert text to speech with voice options
   * @param {string} text - Text to convert
   * @param {Object} options - TTS options
   */
  async textToSpeechAdvanced(text, options = {}) {
    try {
      const { language = 'id', speed = 1.0, voice = 'female' } = options;

      if (!text || text.length === 0) {
        throw new Error('Please provide text to convert');
      }

      if (text.length > 1000) {
        throw new Error('Text too long. Maximum 1000 characters.');
      }

      // Check rate limit from database
      if (!(await this.checkRateLimit('tts_advanced'))) {
        throw new Error('Rate limit exceeded. Please wait before using advanced TTS.');
      }

      // Use alternative TTS service for more options
      const response = await axios.post(
        'https://api.voicerss.org/',
        {
          key: 'your_api_key_here', // Would need actual API key
          src: text,
          hl: language,
          r: speed,
          c: 'mp3',
          f: '44khz_16bit_stereo',
        },
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          responseType: 'arraybuffer',
          timeout: 30000,
        }
      );

      if (response.data.length < 100) {
        throw new Error('Advanced TTS generation failed');
      }

      return {
        success: true,
        buffer: Buffer.from(response.data),
        text,
        options,
        message: `Berhasil mengconvert dengan pengaturan advanced: "${text.substring(0, 50)}${text.length > 50 ? '...' : ''}"`,
      };
    } catch (error) {
      console.error('Error in advanced text-to-speech:', error);

      if (error.message.includes('Rate limit')) {
        throw error;
      }

      // Fallback to basic TTS
      return await this.textToSpeech(text, options.language);
    }
  }

  /**
   * Get available languages for TTS
   */
  getAvailableLanguages() {
    return {
      id: 'Indonesian',
      en: 'English',
      es: 'Spanish',
      fr: 'French',
      de: 'German',
      it: 'Italian',
      pt: 'Portuguese',
      ru: 'Russian',
      ja: 'Japanese',
      ko: 'Korean',
      zh: 'Chinese',
      ar: 'Arabic',
      hi: 'Hindi',
    };
  }

  /**
   * Validate language code
   * @param {string} language - Language code to validate
   */
  validateLanguage(language) {
    const available = this.getAvailableLanguages();
    return available[language] !== undefined;
  }

  /**
   * Check rate limit for TTS operations (now uses database)
   * @param {string} operation - Operation type
   */
  async checkRateLimit(operation) {
    const key = `tts_${operation}`;
    const now = Date.now();

    const limits = {
      tts_global: { cooldown: 5000, maxPerCooldown: 3 }, // 5 seconds, 3 operations
      tts_advanced: { cooldown: 10000, maxPerCooldown: 2 }, // 10 seconds, 2 operations
    };

    const config = limits[operation] || { cooldown: 10000, maxPerCooldown: 1 };

    try {
      const existingLimit = await context.database.rateLimit.findUnique({
        where: { key },
      });

      if (!existingLimit || now - existingLimit.lastUsed.getTime() > config.cooldown) {
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

      if (existingLimit.count >= config.maxPerCooldown) {
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
      console.error('Error checking TTS rate limit:', error);
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
  }

  /**
   * Clean up old TTS files
   */
  async cleanupOldFiles() {
    try {
      const tempDir = await this.ensureTempDir();
      const files = await fs.readdir(tempDir);

      const now = Date.now();
      const maxAge = 60 * 60 * 1000; // 1 hour

      for (const file of files) {
        if (file.endsWith('.mp3') || file.endsWith('.wav') || file.endsWith('.ogg')) {
          const filePath = path.join(tempDir, file);
          const stats = await fs.stat(filePath);

          if (now - stats.mtime.getTime() > maxAge) {
            await fs.unlink(filePath).catch(() => {});
          }
        }
      }
    } catch (error) {
      console.error('Error cleaning up TTS files:', error);
    }
  }

  /**
   * Save TTS audio to file
   * @param {Buffer} audioBuffer - Audio buffer
   * @param {string} filename - Output filename
   */
  async saveTTSFile(audioBuffer, filename) {
    try {
      const tempDir = await this.ensureTempDir();
      const filePath = path.join(tempDir, filename);

      await fs.writeFile(filePath, audioBuffer);

      return {
        success: true,
        filePath,
        message: 'TTS audio saved successfully',
      };
    } catch (error) {
      console.error('Error saving TTS file:', error);
      throw new Error('Failed to save TTS audio');
    }
  }
}

export default new TextToSpeechService();
