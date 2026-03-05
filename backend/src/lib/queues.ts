import { Queue, ConnectionOptions } from 'bullmq';
import configManager from '../config/ConfigManager.js';
import logger from '../utils/logger.js';


const config: any = configManager.export();

// Create a reusable connection object
const redisConnection: ConnectionOptions = {
  host: config.redis?.host || 'localhost',
  port: Number(config.redis?.port) || 6379,
  password: config.redis?.password,
  maxRetriesPerRequest: null,
};

// Create and export the queues
export const imageGenerationQueue = new Queue('image-generation', {
  connection: redisConnection,
});

export const jobResultsQueue = new Queue('job-results', {
  connection: redisConnection,
});

logger.info('✅ BullMQ queues initialized in legacy lib/queues.ts.');
