// lib/retry.js
import logger from '../src/utils/logger.js';

export async function withRetry(fn, maxRetries = 3, initialDelay = 5000) {
    let retryCount = 0;
    while (retryCount < maxRetries) {
        try {
            logger.info(retryCount > 0 ? `🔄 Retry attempt ${retryCount}/${maxRetries - 1}` : '🚀 Starting operation...');
            return await fn();
        } catch (error) {
            retryCount++;
            logger.error(`❌ Operation error (attempt ${retryCount}): ${error.message}`);

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
