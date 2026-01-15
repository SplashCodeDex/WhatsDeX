/**
 * Writing Service - Create custom text images and handwriting
 */

import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { promises as fs } from 'fs';
import { spawn } from 'child_process';
import { Result } from '../types/index.js';
import logger from '../utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

interface TemplateConfig {
  image: string;
  font: string;
  position: { x: number; y: number };
  size: string;
  pointsize: number;
  interline: number;
}

export class WritingService {
  private static instance: WritingService;
  private templates: Record<string, TemplateConfig>;
  private fonts: Record<string, string>;
  private tempDir: string;

  private constructor() {
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
    };

    this.fonts = {
      indie: 'Indie-Flower.ttf',
      impact: 'impact.ttf',
    };

    this.tempDir = path.join(process.cwd(), 'database', 'writing');
  }

  public static getInstance(): WritingService {
    if (!WritingService.instance) {
      WritingService.instance = new WritingService();
    }
    return WritingService.instance;
  }

  async createWriting(text: string, template = 'buku-kiri', font = 'indie'): Promise<Result<{ buffer: Buffer; message: string }>> {
    try {
      if (!text) return { success: false, error: new Error('Text is required') };
      
      const templateConfig = this.templates[template];
      const fontFile = this.fonts[font];

      if (!templateConfig || !fontFile) {
        return { success: false, error: new Error('Invalid template or font') };
      }

      // Process text
      const processedText = text.replace(/(\S+\s*){1,9}/g, '$&\n');
      const fixHeight = processedText.split('\n').slice(0, 31).join('\n');

      const tempDir = await this.ensureTempDir();
      const outputPath = path.join(tempDir, `writing_${Date.now()}.jpg`);

      return new Promise((resolve) => {
        const convert = spawn('convert', [
          templateConfig.image,
          '-font', path.join(__dirname, '../../assets/fonts', fontFile),
          '-size', templateConfig.size,
          '-pointsize', String(templateConfig.pointsize),
          '-interline-spacing', String(templateConfig.interline),
          '-annotate', `+${templateConfig.position.x}+${templateConfig.position.y}`,
          fixHeight,
          outputPath,
        ]);

        let stderr = '';
        convert.stderr.on('data', data => { stderr += data.toString(); });

        convert.on('close', async code => {
          if (code === 0) {
            try {
              const resultBuffer = await fs.readFile(outputPath);
              await fs.unlink(outputPath).catch(() => {});
              resolve({ success: true, data: { buffer: resultBuffer, message: 'Writing created' } });
            } catch (err) {
              resolve({ success: false, error: new Error('Failed to read output') });
            }
          } else {
            resolve({ success: false, error: new Error(`IM error: ${stderr}`) });
          }
        });
      });
    } catch (error: unknown) {
      return { success: false, error: error instanceof Error ? error : new Error(String(error)) };
    }
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

export const writingService = WritingService.getInstance();
export default writingService;