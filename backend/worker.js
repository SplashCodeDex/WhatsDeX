import { imageGenerationQueue, jobResultsQueue } from './lib/queues.js';
import { createUrl } from './tools/api.js';
import redis from 'ioredis';
import config from '../config.js';

// Load environment variables from root .env explicitly
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import dotenv from 'dotenv';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
// Resolve root .env (one level up from backend/)
dotenv.config({ path: join(__dirname, '..', '.env') });

// Connect to Redis for logging and potential other uses
const redisClient = new redis({
  host: config.redis.host,
  port: config.redis.port,
  password: config.redis.password,
});

console.log('✅ Worker process started. Waiting for image generation jobs...');

(async () => {
  try {
    const { waitForRedis } = await import('./src/utils/readiness.js');
    await waitForRedis({
      host: config.redis.host,
      port: config.redis.port,
      password: config.redis.password || undefined,
      logger: console,
    });
    console.log('✅ Redis readiness confirmed for worker');
  } catch (e) {
    console.error('❌ Redis readiness check failed for worker:', e?.message || e);
    process.exit(1);
  }
})();

// Define the processor for the image generation queue
imageGenerationQueue.process(async (job) => {
  try {
    const { input, userJid } = job.data;
    console.log(`⚙️ Processing job ${job.id} for user ${userJid} with prompt: "${input}"`);

    // This is the core logic from the original command
    const imageUrl = createUrl('davidcyril', '/ai/dalle', { text: input });

    if (!imageUrl) {
      throw new Error('Failed to create image URL.');
    }

    // Add the result to the results queue for the main process to handle
    await jobResultsQueue.add({
      userJid,
      imageUrl,
      input,
      used: job.data.used, // Pass the context through
      success: true,
    });

    console.log(`✅ Finished processing job ${job.id}. Result added to jobResultsQueue.`);
  } catch (error) {
    console.error(`❌ Error processing job ${job.id}:`, error.message);
    // Notify the main process that the job failed
    await jobResultsQueue.add({
      userJid: job.data.userJid,
      input: job.data.input,
      success: false,
      error: error.message,
    });
  }
});

redisClient.on('connect', () => {
  console.log('✅ Worker Redis client connected successfully!');
});

redisClient.on('error', (err) => {
  console.error('❌ Worker Redis client error:', err);
});
