const { Worker } = require('bullmq');
const originalContext = require('../context'); // Assuming context.js is in the root
const createBotContext = require('../src/utils/createBotContext');
const WhatsDeXBrain = require('../src/services/WhatsDeXBrain');

// IMPORTANT: BullMQ requires a direct Redis connection (ioredis compatible),
// not the REST API URL/TOKEN used by @upstash/redis.
// You will need to get the REDIS_HOST, REDIS_PORT, and REDIS_PASSWORD for direct connection from Upstash.
const worker = new Worker(
  'whatsapp-messages',
  async job => {
    const { msg } = job.data;
    console.log('Processing message from queue:', msg.key.id);

    const { processWebhookMessage } = require('./pages/api/bot-message'); // Import the processing function

    // ... inside the worker's process function ...
    try {
      // We don't have req.headers here, so we'll use placeholders for ip, userAgent, etc.
      const requestInfo = {
        ip: 'queue-worker',
        userAgent: 'queue-worker',
        sessionId: 'queue-worker',
        location: 'queue-worker',
      };
      await processWebhookMessage(msg, requestInfo);
      console.log('Message processed successfully:', msg.key.id);
    } catch (error) {
      console.error('Error processing message from queue:', error);
      throw error; // Re-throw to indicate job failure
    }
  },
  {
    connection: {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD,
      tls: process.env.REDIS_TLS === 'true' ? {} : undefined,
    },
  }
);

worker.on('completed', job => {
  console.log(`Job ${job.id} completed.`);
});

worker.on('failed', (job, err) => {
  console.error(`Job ${job.id} failed with error ${err.message}`);
});

console.log('BullMQ Worker started for whatsapp-messages queue.');
