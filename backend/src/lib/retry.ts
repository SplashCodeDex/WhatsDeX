// lib/retry.ts
import logger from '../utils/logger.js';


export async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  initialDelay: number = 5000
): Promise<T | undefined> {
  let retryCount = 0;
  while (retryCount < maxRetries) {
    try {
      logger.info(
        retryCount > 0
          ? `🔄 Retry attempt ${retryCount}/${maxRetries - 1}`
          : '🚀 Starting operation...'
      );
      return await fn();
    } catch (error: any) {
      retryCount++;
      logger.error(`❌ Operation error (attempt ${retryCount}): ${error?.message || error}`);

      if (retryCount >= maxRetries) {
        logger.error('💀 Max retry attempts reached. Failing...');
        throw error;
      } else {
        const delay = retryCount * initialDelay;
        logger.info(`⏰ Waiting ${delay / 1000}s before retry...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
}
