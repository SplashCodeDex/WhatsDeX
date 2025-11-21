import path from 'path';

import Bull from 'bull';
import { createClient } from 'redis';

const redisClient = createClient({
  username: process.env.REDIS_USERNAME || 'default',
  password: process.env.REDIS_PASSWORD || '',
  socket: {
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379,
    connectTimeout: 5000,
    lazyConnect: true,
    reconnectDelayOnFailover: 100,
    maxRetriesPerRequest: 3
  },
  retryDelayOnFailover: 100,
  retryDelayOnClusterDown: 300,
  maxRetriesPerRequest: 3
});

// Enhanced Redis error handling with reconnection logic
redisClient.on('error', (err) => {
  console.error('🔴 Redis Client Error:', err.message);
  if (err.code === 'ECONNREFUSED') {
    console.log('🔄 Redis connection refused, will retry automatically...');
  }
});

redisClient.on('connect', () => {
  console.log('✅ Redis connected successfully');
});

redisClient.on('ready', () => {
  console.log('🟢 Redis client ready');
});

redisClient.on('reconnecting', () => {
  console.log('🔄 Redis reconnecting...');
});

// Initialize connection with error handling
async function initializeRedis() {
  try {
    await redisClient.connect();
    console.log('✅ Redis client initialized');
  } catch (error) {
    console.error('❌ Failed to connect to Redis:', error.message);
    console.log('⚠️  Message queue will operate in fallback mode');
  }
}

initializeRedis();

const messageQueue = new Bull('message-queue', { redis: redisClient });

messageQueue.process(async job => {
  console.log('worker.js: Processing job:', job.id);
  try {
    const processor = (await import(path.join(import.meta.url, 'message-processor.js'))).default;
    await processor(job);
    console.log(`✅ Job ${job.id} processed successfully`);
  } catch (error) {
    console.error(`❌ Job ${job.id} failed:`, error.message);
    // Rethrow to let Bull handle retry logic
    throw error;
  }
});

// Add queue error handling
messageQueue.on('error', (error) => {
  console.error('🔴 Message queue error:', error);
});

messageQueue.on('failed', (job, error) => {
  console.error(`❌ Job ${job.id} failed after retries:`, error.message);
});

messageQueue.on('stalled', (job) => {
  console.warn(`⚠️  Job ${job.id} stalled and will be retried`);
});

export default messageQueue;
