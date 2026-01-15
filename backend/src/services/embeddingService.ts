import { GoogleGenerativeAI } from '@google/generative-ai';
import { Result } from '../types/index.js';
import logger from '../utils/logger.js';

export class EmbeddingService {
  private static instance: EmbeddingService;
  private genAI: GoogleGenerativeAI;
  private model: string;
  private maxRetries: number;
  private baseDelay: number;

  private constructor() {
    const apiKey = process.env.GOOGLE_GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GOOGLE_GEMINI_API_KEY environment variable is required');
    }
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = 'text-embedding-004';
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
        const embeddingModel = this.genAI.getGenerativeModel({ model: this.model });
        const result = await embeddingModel.embedContent(cleanText);
        return result.embedding.values;
      });

      return { success: true, data: embedding };
    } catch (error: unknown) {
      return { success: false, error: error instanceof Error ? error : new Error(String(error)) };
    }
  }

  private async withRetry<T>(operation: () => Promise<T>): Promise<T> {
    let lastError: unknown;
    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error: unknown) {
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
