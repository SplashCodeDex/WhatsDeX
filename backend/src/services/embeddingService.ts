import OpenAI from 'openai';
import { Result } from '../types/index.js';
import logger from '../utils/logger.js';

export class EmbeddingService {
  private static instance: EmbeddingService;
  private client: any;
  private model: string;
  private maxRetries: number;
  private baseDelay: number;

  private constructor() {
    this.client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
    this.model = 'text-embedding-3-small';
    this.maxRetries = 3;
    this.baseDelay = 2000;
  }

  public static getInstance(): EmbeddingService {
    if (!EmbeddingService.instance) {
      EmbeddingService.instance = new EmbeddingService();
    }
    return EmbeddingService.instance;
  }

  async generateEmbedding(text: string): Promise<Result<number[]>> {
    if (!text) return { success: false, error: new Error('Text is required') };

    const cleanText = text.trim().substring(0, 8000);

    try {
      const embedding = await this.withRetry(async () => {
        const response = await this.client.embeddings.create({
          model: this.model,
          input: cleanText,
          encoding_format: 'float'
        });
        return response.data[0].embedding;
      });

      return { success: true, data: embedding };
    } catch (error: unknown) {
      return { success: false, error: error instanceof Error ? error : new Error(String(error)) };
    }
  }

  private async withRetry<T>(operation: () => Promise<T>): Promise<T> {
    let lastError: any;
    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error: any) {
        lastError = error;
        if (attempt === this.maxRetries) break;
        const delay = this.baseDelay * Math.pow(2, attempt - 1);
        logger.warn(`Embedding API attempt ${attempt} failed, retrying...`);
        await new Promise(res => setTimeout(res, delay));
      }
    }
    throw lastError;
  }
}

export const embeddingService = EmbeddingService.getInstance();
export default embeddingService;
