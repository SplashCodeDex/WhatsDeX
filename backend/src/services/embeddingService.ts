import { GoogleGenerativeAI } from '@google/generative-ai';
import { Result } from '../types/index.js';
import logger from '../utils/logger.js';
import { ApiKeyManager, isQuotaError } from '../lib/apiKeyManager.js';

/**
 * Embedding Service with API Key Rotation
 *
 * Generates text embeddings using Google's text-embedding-004 model
 * with automatic API key rotation on rate limits.
 */
export class EmbeddingService {
  private static instance: EmbeddingService | null = null;
  private keyManager: ApiKeyManager;
  private genAI: GoogleGenerativeAI;
  private currentKey: string;
  private readonly model: string;
  private readonly baseDelay: number;

  private constructor(keyManager: ApiKeyManager, initialKey?: string) {
    this.keyManager = keyManager;
    this.currentKey = initialKey || '';
    this.genAI = this.currentKey ? new GoogleGenerativeAI(this.currentKey) : ({} as GoogleGenerativeAI);
    this.model = 'text-embedding-004';
    this.baseDelay = 1000;

    const stats = this.keyManager.getStats();
    if (stats.totalKeys > 0) {
      logger.info(`EmbeddingService initialized with ${stats.totalKeys} API keys (${stats.healthyKeys} healthy)`);
    } else {
      logger.info('EmbeddingService initialized in disabled state.');
    }
  }

  /**
   * Get or create the singleton instance.
   * Returns Result pattern for safe initialization.
   */
  public static getInstance(): Result<EmbeddingService> {
    if (EmbeddingService.instance) {
      return { success: true, data: EmbeddingService.instance };
    }

    const managerResult = ApiKeyManager.getInstance();
    if (!managerResult.success) {
      return managerResult; // Propagate critical error
    }

    const keyManager = managerResult.data;

    // Handle disabled case
    if (keyManager.getKeyCount() === 0) {
      EmbeddingService.instance = new EmbeddingService(keyManager);
      return { success: true, data: EmbeddingService.instance };
    }

    // Handle enabled case
    const keyResult = keyManager.getKey();
    if (!keyResult.success) {
      // This is an unexpected state if keys exist
      return {
        success: false,
        error: new Error('Failed to retrieve key from a non-empty ApiKeyManager'),
      };
    }

    EmbeddingService.instance = new EmbeddingService(keyManager, keyResult.data);
    return { success: true, data: EmbeddingService.instance };
  }

  /**
   * Reset singleton (for testing).
   */
  public static resetInstance(): void {
    EmbeddingService.instance = null;
  }

  /**
   * Refresh the client with a new key from the rotation pool.
   */
  private refreshClient(): void {
    const keyResult = this.keyManager.getKey();
    if (!keyResult.success) {
      logger.error('[EmbeddingService] Failed to get new key during rotation:', keyResult.error);
      return;
    }

    if (keyResult.data !== this.currentKey) {
      this.currentKey = keyResult.data;
      this.genAI = new GoogleGenerativeAI(this.currentKey);
      logger.info(`[EmbeddingService] Rotated to new API key ...${this.currentKey.slice(-4)}`);
    }
  }

  /**
   * Generate embedding for text with automatic key rotation on failures.
   *
   * @param text - The text to generate embedding for (max 8000 chars)
   * @returns Result containing the embedding vector or an error
   */
  async generateEmbedding(text: string): Promise<Result<number[]>> {
    if (this.keyManager.getKeyCount() === 0) {
        return {
            success: false,
            error: new Error('EmbeddingService is disabled. GOOGLE_GEMINI_API_KEY is not configured.'),
        };
    }
    if (!text) {
      return { success: false, error: new Error('Text is required') };
    }

    const cleanText = text.trim().substring(0, 8000);
    const maxAttempts = this.keyManager.getKeyCount() + 1;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const embeddingModel = this.genAI.getGenerativeModel({ model: this.model });
        const result = await embeddingModel.embedContent(cleanText);
        const embedding = result.embedding.values;

        // Mark key as successful
        this.keyManager.markSuccess(this.currentKey);

        return { success: true, data: embedding };
      } catch (error: unknown) {
        const err = error instanceof Error ? error : new Error(String(error));
        const isQuota = isQuotaError(error);

        // Mark key as failed
        this.keyManager.markFailed(this.currentKey, isQuota);

        logger.warn(`[EmbeddingService] Attempt ${attempt}/${maxAttempts} failed`, {
          error: err.message,
          isQuotaError: isQuota,
          keyHint: `...${this.currentKey.slice(-4)}`,
        });

        if (attempt === maxAttempts) {
          logger.error('[EmbeddingService] All keys exhausted', { error: err.message });
          return { success: false, error: err };
        }

        // Rotate to next key
        this.refreshClient();

        // Exponential backoff (shorter for quota errors)
        const delay = isQuota ? 300 : this.baseDelay * Math.pow(2, attempt - 1);
        await new Promise(res => setTimeout(res, delay));
      }
    }

    // Unreachable, but TypeScript requires it
    return { success: false, error: new Error('Unexpected end of retry loop') };
  }
}

/**
 * Get the singleton instance, throwing on initialization failure.
 * Use EmbeddingService.getInstance() for Result-pattern access.
 */
function getEmbeddingService(): EmbeddingService {
  const result = EmbeddingService.getInstance();
  if (!result.success) {
    throw result.error;
  }
  return result.data;
}

// Lazy initialization - will throw if env var not set
export const embeddingService = getEmbeddingService();
export default embeddingService;
