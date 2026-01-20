import Queue from 'bull';
import configManager from '../config/ConfigManager.js';
import logger from '../utils/logger.js';


const config: any = configManager.export();

// Create a reusable connection object
const redisConnection = {
  host: config.redis?.host || 'localhost',
  port: config.redis?.port || 6379,
  password: config.redis?.password,
};

// Create and export the queues
export const imageGenerationQueue = new Queue('image-generation', {
  redis: redisConnection,
});

export const jobResultsQueue = new Queue('job-results', {
  redis: redisConnection,
});

// You can add more queues here as needed
// export const videoProcessingQueue = new Queue('video-processing', { redis: redisConnection });

// Add event listeners for logging and debugging (optional but recommended)
imageGenerationQueue.on('completed', (job, result) => {
  logger.info(`✅ Job ${job.id} (image-generation) completed successfully.`);
});

imageGenerationQueue.on('failed', (job, err) => {
  logger.error(`❌ Job ${job.id} (image-generation) failed with error:`, { error: err.message });
});

jobResultsQueue.on('completed', (job, result) => {
  logger.info(`✅ Job ${job.id} (job-results) completed successfully.`);
});

jobResultsQueue.on('failed', (job, err) => {
  logger.error(`❌ Job ${job.id} (job-results) failed with error:`, { error: err.message });
});

logger.info('✅ Bull queues initialized.');
