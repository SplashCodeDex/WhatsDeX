import { Queue, QueueEvents } from 'bullmq';
import configManager from '../config/ConfigManager.js';
import logger from '../utils/logger.js';


const config: any = configManager.export();

// Create a reusable connection object
const redisConnection = {
  host: config.redis?.host || 'localhost',
  port: config.redis?.port || 6379,
  password: config.redis?.password,
  maxRetriesPerRequest: null,
};

// Create and export the queues
export const imageGenerationQueue = new Queue('image-generation', {
  connection: redisConnection,
});

export const imageGenerationEvents = new QueueEvents('image-generation', {
  connection: redisConnection,
});

export const jobResultsQueue = new Queue('job-results', {
  connection: redisConnection,
});

export const jobResultsEvents = new QueueEvents('job-results', {
  connection: redisConnection,
});

// You can add more queues here as needed

// Add event listeners for logging and debugging
imageGenerationEvents.on('completed', ({ jobId, returnvalue }) => {
  logger.info(`✅ Job ${jobId} (image-generation) completed successfully.`);
});

imageGenerationEvents.on('failed', ({ jobId, failedReason }) => {
  logger.error(`❌ Job ${jobId} (image-generation) failed with error:`, { error: failedReason });
});

jobResultsEvents.on('completed', ({ jobId, returnvalue }) => {
  logger.info(`✅ Job ${jobId} (job-results) completed successfully.`);
});

jobResultsEvents.on('failed', ({ jobId, failedReason }) => {
  logger.error(`❌ Job ${jobId} (job-results) failed with error:`, { error: failedReason });
});

logger.info('✅ BullMQ queues initialized.');
