import path from 'path';

import Bull from 'bull';
import { createClient } from 'redis';

const redisClient = createClient({
  username: process.env.REDIS_USERNAME || 'default',
  password: process.env.REDIS_PASSWORD || '',
  socket: {
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379,
  },
});

redisClient.on('error', err => console.log('Redis Client Error', err));

const messageQueue = new Bull('message-queue', { redis: redisClient });

messageQueue.process(async job => {
  console.log('worker.js: Processing job:', job.id);
  const processor = (await import(path.join(import.meta.url, 'message-processor.js'))).default;
  await processor(job);
});

export default messageQueue;
