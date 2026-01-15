/**
 * Text-to-Speech Service - Convert text to audio
 */

import path from 'path';
import axios from 'axios';
import { promises as fs } from 'fs';
import { Result } from '../types/index.js';
import logger from '../utils/logger.js';

export class TextToSpeechService {
  private static instance: TextToSpeechService;
  private tempDir: string;

  private constructor() {
    this.tempDir = path.join(process.cwd(), 'database', 'tts');
  }

  public static getInstance(): TextToSpeechService {
    if (!TextToSpeechService.instance) {
      TextToSpeechService.instance = new TextToSpeechService();
    }
    return TextToSpeechService.instance;
  }

  /**
   * Convert text to speech
   */
  async textToSpeech(text: string, language = 'id'): Promise<Result<{ buffer: Buffer; message: string }>> {
    try {
      if (!text) return { success: false, error: new Error('Text is required') };
      if (text.length > 500) return { success: false, error: new Error('Text too long') };

      const ttsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=${language}&q=${encodeURIComponent(text)}`;

      const response = await axios.get(ttsUrl, {
        responseType: 'arraybuffer',
        headers: {
          'User-Agent': 'Mozilla/5.0',
          Referer: 'https://translate.google.com/',
        },
        timeout: 30000,
      });

      return {
        success: true,
        data: {
          buffer: Buffer.from(response.data),
          message: `Success: ${text.substring(0, 20)}...`
        }
      };
    } catch (error: unknown) {
      return { success: false, error: error instanceof Error ? error : new Error(String(error)) };
    }
  }

  getAvailableLanguages(): Record<string, string> {
    return {
      id: 'Indonesian',
      en: 'English',
      es: 'Spanish',
      fr: 'French',
      de: 'German',
    };
  }

  public async ensureTempDir(): Promise<string> {
    try {
      await fs.access(this.tempDir);
    } catch {
      await fs.mkdir(this.tempDir, { recursive: true });
    }
    return this.tempDir;
  }
}

export const textToSpeechService = TextToSpeechService.getInstance();
export default textToSpeechService;